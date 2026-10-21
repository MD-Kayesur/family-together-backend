import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendChatMessageDto, TypingEventDto, MarkReadDto } from './chat.dto';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: (origin: any, callback: any) => {
      callback(null, true);
    },
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  // Track active users: userId -> Set of connected socket IDs (supports multiple tabs / devices)
  private readonly activeUsers = new Map<string, Set<string>>();
  // Track last active timestamp: userId -> ISO string
  private readonly lastActiveTimes = new Map<string, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  getOnlineUserIds(): string[] {
    return Array.from(this.activeUsers.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.activeUsers.has(userId) && (this.activeUsers.get(userId)?.size ?? 0) > 0;
  }

  getLastActiveMap(): Record<string, string> {
    return Object.fromEntries(this.lastActiveTimes);
  }

  async getLastActiveMapWithDbFallback(): Promise<Record<string, string>> {
    const map: Record<string, string> = {};
    try {
      const users = await this.prisma.user.findMany({
        select: { id: true, lastActiveAt: true },
      });
      for (const u of users) {
        if (u.lastActiveAt) {
          map[u.id] = u.lastActiveAt.toISOString();
        }
      }
    } catch {
      // Fallback to in-memory only
    }

    // Overlay in-memory live updates
    for (const [userId, timestamp] of this.lastActiveTimes.entries()) {
      map[userId] = timestamp;
    }
    return map;
  }

  async handleConnection(client: Socket) {
    try {
      let token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization;

      if (!token && client.handshake.headers?.cookie) {
        // Fallback for cookie parsing if passed
        const match = client.handshake.headers.cookie.match(/access_token=([^;]+)/);
        if (match) token = match[1];
      }

      if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
      }

      if (!token) {
        this.logger.warn(`Client disconnected: No auth token provided (${client.id})`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'family-roots-jwt-secret-key-2026',
      });

      client.data.user = payload;
      const userId = payload.sub || payload.userId || payload.id;
      client.data.userId = userId;

      // Join individual user room for direct alerts
      client.join(`user_${userId}`);

      // Track active online socket
      if (!this.activeUsers.has(userId)) {
        this.activeUsers.set(userId, new Set());
      }
      this.activeUsers.get(userId)!.add(client.id);

      const nowIso = new Date().toISOString();
      this.lastActiveTimes.set(userId, nowIso);

      // Asynchronously update lastActiveAt in PostgreSQL
      this.prisma.user
        .update({
          where: { id: userId },
          data: { lastActiveAt: new Date() },
        })
        .catch(() => {});

      this.logger.log(`Socket authenticated: User ${userId} connected (${this.activeUsers.get(userId)!.size} active socket(s))`);

      // 1. Send the newly connected user the full presence list + last active timestamps
      const fullPresence = await this.getLastActiveMapWithDbFallback();
      client.emit('presence_data', {
        onlineUserIds: Array.from(this.activeUsers.keys()),
        lastActiveMap: fullPresence,
      });
      client.emit('online_users_list', Array.from(this.activeUsers.keys()));

      // 2. Broadcast to all other users that this user came online
      this.server.emit('user_status_changed', {
        userId,
        status: 'online',
        lastActiveAt: nowIso,
        timestamp: nowIso,
      });
    } catch (err: any) {
      this.logger.warn(`Socket authentication failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && this.activeUsers.has(userId)) {
      const userSockets = this.activeUsers.get(userId)!;
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.activeUsers.delete(userId);
        const offlineIso = new Date().toISOString();
        this.lastActiveTimes.set(userId, offlineIso);

        // Update database lastActiveAt
        this.prisma.user
          .update({
            where: { id: userId },
            data: { lastActiveAt: new Date() },
          })
          .catch(() => {});

        this.logger.log(`User ${userId} went offline at ${offlineIso}`);
        // Broadcast to everyone that this user went offline with exact offline timestamp
        this.server.emit('user_status_changed', {
          userId,
          status: 'offline',
          lastActiveAt: offlineIso,
          timestamp: offlineIso,
        });
      } else {
        this.logger.log(`User ${userId} disconnected socket ${client.id} (${userSockets.size} remaining)`);
      }
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('get_online_users')
  async handleGetOnlineUsers() {
    return {
      onlineUserIds: Array.from(this.activeUsers.keys()),
      lastActiveMap: await this.getLastActiveMapWithDbFallback(),
    };
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    client.join(`conv_${data.conversationId}`);
    return { status: 'joined', conversationId: data.conversationId };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    client.leave(`conv_${data.conversationId}`);
    return { status: 'left', conversationId: data.conversationId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendChatMessageDto,
  ) {
    try {
      const senderId = client.data.userId;
      if (!senderId) {
        return { error: 'Unauthorized' };
      }

      const savedMessage = await this.chatService.saveMessage(senderId, dto);

      // Broadcast to all participants in this conversation
      this.server.to(`conv_${dto.conversationId}`).emit('new_message', savedMessage);

      // Return acknowledgment to sender
      return { success: true, message: savedMessage };
    } catch (err: any) {
      this.logger.error(`send_message failed: ${err.message}`);
      return { error: err.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: TypingEventDto,
  ) {
    const senderId = client.data.userId;
    client.to(`conv_${dto.conversationId}`).emit('user_typing', {
      conversationId: dto.conversationId,
      userId: senderId,
      isTyping: dto.isTyping,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: MarkReadDto,
  ) {
    try {
      const userId = client.data.userId;
      await this.chatService.markAsRead(dto.conversationId, userId);
      client.to(`conv_${dto.conversationId}`).emit('message_read', {
        conversationId: dto.conversationId,
        readBy: userId,
      });
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
