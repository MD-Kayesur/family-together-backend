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
import { PushService } from './push.service';

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

  // Cache DB last active times to avoid blocking socket connection with remote database queries
  private cachedDbLastActiveMap: Record<string, string> = {};
  private lastDbFetchTime = 0;
  private readonly DB_CACHE_TTL = 60000; // 60 seconds TTL

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
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
    const now = Date.now();
    // Return cached map if within TTL to guarantee sub-millisecond socket handshake
    if (now - this.lastDbFetchTime < this.DB_CACHE_TTL && Object.keys(this.cachedDbLastActiveMap).length > 0) {
      const merged = { ...this.cachedDbLastActiveMap };
      for (const [userId, timestamp] of this.lastActiveTimes.entries()) {
        merged[userId] = timestamp;
      }
      return merged;
    }

    try {
      const users = await this.prisma.user.findMany({
        select: { id: true, lastActiveAt: true },
      });
      const dbMap: Record<string, string> = {};
      for (const u of users) {
        if (u.lastActiveAt) {
          dbMap[u.id] = u.lastActiveAt.toISOString();
        }
      }
      this.cachedDbLastActiveMap = dbMap;
      this.lastDbFetchTime = now;
    } catch {
      // Fallback to in-memory only
    }

    // Overlay in-memory live updates
    const finalMap = { ...this.cachedDbLastActiveMap };
    for (const [userId, timestamp] of this.lastActiveTimes.entries()) {
      finalMap[userId] = timestamp;
    }
    return finalMap;
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
        client.emit('auth_error', { message: 'No auth token provided' });
        client.disconnect(true);
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
      client.emit('auth_error', { message: err.message });
      client.disconnect(true);
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

      // 1. Broadcast to the active conversation room (for currently focused chat window)
      this.server.to(`conv_${dto.conversationId}`).emit('new_message', savedMessage);

      // 2. Fetch all participants to alert their personal devices/tabs
      try {
        const participants = await this.prisma.conversationParticipant.findMany({
          where: { conversationId: dto.conversationId },
          select: { userId: true },
        });

        for (const p of participants) {
          if (p.userId !== senderId) {
            // Send direct socket alert to user's personal room across any active tab/window
            this.server.to(`user_${p.userId}`).emit('new_message', savedMessage);
            this.server.to(`user_${p.userId}`).emit('message_notification', {
              id: savedMessage.id,
              conversationId: dto.conversationId,
              senderId,
              senderName: savedMessage.senderName,
              avatar: savedMessage.avatar,
              text: savedMessage.text,
              createdAt: savedMessage.createdAt,
            });

            // Dispatch background Web Push (rings / vibrates phone & desktop even when app is closed)
            this.pushService
              .sendPushToUser(p.userId, {
                title: `Message from ${savedMessage.senderName}`,
                body: savedMessage.text || 'Sent an attachment',
                icon: savedMessage.avatar || '/icon.png',
                conversationId: dto.conversationId,
                senderId,
                url: `/user-dashboard?tab=messages&convId=${dto.conversationId}`,
              })
              .catch(() => {});
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to dispatch participant notifications: ${err.message}`);
      }

      // Return acknowledgment to sender
      return { success: true, message: savedMessage };
    } catch (err: any) {
      this.logger.error(`send_message failed: ${err.message}`);
      return { error: err.message };
    }
  }

  @SubscribeMessage('register_push_subscription')
  handleRegisterPush(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string },
  ) {
    const userId = client.data?.userId;
    if (!userId) return { error: 'Unauthorized' };
    return this.pushService.saveSubscription(userId, data);
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
