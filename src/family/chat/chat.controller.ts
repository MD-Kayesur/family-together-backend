import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendChatMessageDto } from './chat.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Real-Time Family Chat & Messenger')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('family/chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

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
}
