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

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

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
      this.logger.log(`Socket authenticated: User ${userId} joined room user_${userId}`);
    } catch (err: any) {
      this.logger.warn(`Socket authentication failed: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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
