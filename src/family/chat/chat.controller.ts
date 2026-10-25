import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendChatMessageDto, UpdateChatMessageDto } from './chat.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { PushService } from './push.service';

@ApiTags('Real-Time Family Chat & Messenger')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('family/chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly pushService: PushService,
  ) {}

  @Get('push-key')
  @ApiOperation({ summary: 'Get VAPID public key for device push notification subscription' })
  getPushPublicKey() {
    return {
      publicKey: this.pushService.getPublicKey(),
    };
  }

  @Post('push-subscribe')
  @ApiOperation({ summary: 'Register device push notification subscription for the authenticated user' })
  subscribeToPush(
    @Req() req: any,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.pushService.saveSubscription(userId, body);
  }

  @Get('online-users')
  @ApiOperation({ summary: 'Get list of currently active / online user IDs and last active timestamps' })
  async getOnlineUsers() {
    return {
      onlineUserIds: this.chatGateway.getOnlineUserIds(),
      lastActiveMap: await this.chatGateway.getLastActiveMapWithDbFallback(),
    };
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all platform and family users available for chat and presence' })
  async getChatUsers(@Req() req: any) {
    const currentUserId = req.user.id || req.user.sub;
    const currentUserRole = req.user.role || 'MEMBER';

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        role: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: {
        lastActiveAt: 'desc',
      },
    });

    const onlineUserIds = new Set(this.chatGateway.getOnlineUserIds());
    const lastActiveMap = await this.chatGateway.getLastActiveMapWithDbFallback();

    return users.map((u) => {
      const isOwnerTarget = u.role === 'OWNER';
      const isRestricted = currentUserRole === 'MEMBER' && isOwnerTarget;

      return {
        id: u.id,
        fullName: u.fullName || u.email,
        email: u.email,
        avatarUrl: u.avatarUrl,
        role: u.role,
        online: onlineUserIds.has(u.id),
        lastActiveAt: lastActiveMap[u.id] || (u.lastActiveAt ? u.lastActiveAt.toISOString() : null),
        canMessage: !isRestricted,
        isOwnerTarget,
      };
    });
  }

  private async getFamilyIdForUser(userId: string): Promise<string> {
    const membership = await this.prisma.familyMember.findFirst({
      where: {
        person: {
          userId,
        },
      },
    });

    if (membership) return membership.familyId;

    // Fallback: Check if user owns a family
    const owned = await this.prisma.family.findFirst({
      where: { createdBy: userId },
    });
    if (owned) return owned.id;

    // Default fallback to first family
    const anyFamily = await this.prisma.family.findFirst();
    return anyFamily ? anyFamily.id : '';
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all chat conversations for logged-in user' })
  async getConversations(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    const familyId = await this.getFamilyIdForUser(userId);
    return this.chatService.getUserConversations(userId, familyId);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Get or start a direct 1-on-1 conversation with connection validation' })
  async createConversation(
    @Req() req: any,
    @Body() dto: CreateConversationDto,
  ) {
    const userId = req.user.id || req.user.sub;
    const familyId = await this.getFamilyIdForUser(userId);
    if (!dto.recipientId) {
      throw new BadRequestException('recipientId is required to start a conversation');
    }
    return this.chatService.getOrCreateDirectConversation(userId, dto.recipientId, familyId);
  }

  @Get('can-message/:recipientId')
  @ApiOperation({ summary: 'Check if user can message target (Facebook Messenger logic)' })
  async canMessage(
    @Req() req: any,
    @Param('recipientId') recipientId: string,
  ) {
    const userId = req.user.id || req.user.sub;
    const familyId = await this.getFamilyIdForUser(userId);
    const allowed = await this.chatService.canInitiateMessage(userId, recipientId, familyId);
    return { allowed };
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get chat history for a conversation' })
  async getMessages(
    @Req() req: any,
    @Param('id') conversationId: string,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.chatService.getConversationMessages(conversationId, userId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message via REST (fallback or initial)' })
  async sendMessage(
    @Req() req: any,
    @Body() dto: SendChatMessageDto,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.chatService.saveMessage(userId, dto);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  async markRead(
    @Req() req: any,
    @Param('id') conversationId: string,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.chatService.markAsRead(conversationId, userId);
  }

  @Patch('messages/:id')
  @ApiOperation({
    summary: 'Edit / update a chat message [Roles: Message Sender, OWNER, ADMIN]',
    description: `**Route:** \`PATCH /family/chat/messages/:id\`
**Purpose:** Allows message sender (or sanctuary owner) to edit their previously sent message text.
**Permissions:** Message sender or Sanctuary Administrator.`,
  })
  @ApiParam({ name: 'id', description: 'Unique message identifier' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  async updateMessage(
    @Req() req: any,
    @Param('id') messageId: string,
    @Body() dto: UpdateChatMessageDto,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.chatService.updateMessage(messageId, userId, dto);
  }

  @Delete('messages/:id')
  @ApiOperation({
    summary: 'Delete a chat message [Roles: Message Sender, OWNER, ADMIN]',
    description: `**Route:** \`DELETE /family/chat/messages/:id\`
**Purpose:** Removes a single message from conversation thread history.
**Permissions:** Sender or Sanctuary Administrator.`,
  })
  @ApiParam({ name: 'id', description: 'Unique message identifier' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  async deleteMessage(
    @Req() req: any,
    @Param('id') messageId: string,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.chatService.deleteMessage(messageId, userId);
  }

  @Delete('conversations/:id')
  @ApiOperation({
    summary: 'Delete an entire conversation thread [Roles: Participant, OWNER, ADMIN]',
    description: `**Route:** \`DELETE /family/chat/conversations/:id\`
**Purpose:** Removes the conversation and all associated messages permanently.
**Permissions:** Participant in the thread or Sanctuary Administrator.`,
  })
  @ApiParam({ name: 'id', description: 'Unique conversation identifier' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  async deleteConversation(
    @Req() req: any,
    @Param('id') conversationId: string,
  ) {
    const userId = req.user.id || req.user.sub;
    return this.chatService.deleteConversation(conversationId, userId);
  }
}

