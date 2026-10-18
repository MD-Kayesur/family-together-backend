import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto, SendChatMessageDto, UpdateChatMessageDto } from './chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Facebook Messenger connection check:
   * 1. Member CANNOT initiate messages to the Sanctuary Owner.
   * 2. Members can only message who added them or who they added (createdById),
   *    or who shares an active relationship in the family tree.
   * 3. Owners/SuperAdmins can message anyone.
   */
  async canInitiateMessage(senderId: string, recipientId: string, familyId: string): Promise<boolean> {
    if (senderId === recipientId) return false;

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      include: { person: true },
    });
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      include: { person: true },
    });

    if (!sender || !recipient) return false;

    // RULE 1: Regular MEMBER cannot initiate direct chat with OWNER
    if (sender.role === 'MEMBER' && recipient.role === 'OWNER') {
      return false;
    }

    // RULE 2: OWNER or SUPER_ADMIN can message any member
    if (sender.role === 'OWNER' || sender.role === 'SUPER_ADMIN') {
      return true;
    }

    // RULE 3: Who added whom? (Creator / Added tracking)
    if (sender.createdById === recipient.id || recipient.createdById === sender.id) {
      return true;
    }

    // RULE 4: Facebook-style relationship check (connected relatives in family tree)
    if (sender.person && recipient.person) {
      const activeLink = await this.prisma.relationship.findFirst({
        where: {
          familyId,
          status: 'ACTIVE',
          OR: [
            { fromPersonId: sender.person.id, toPersonId: recipient.person.id },
            { fromPersonId: recipient.person.id, toPersonId: sender.person.id },
            { createdBy: sender.id, toPersonId: recipient.person.id },
            { createdBy: recipient.id, toPersonId: sender.person.id },
          ],
        },
      });

      if (activeLink) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find or Create a 1-on-1 Direct Conversation
   */
  async getOrCreateDirectConversation(senderId: string, recipientId: string, familyId: string) {
    // 1. Check if conversation already exists between these 2 users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        familyId,
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
            },
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // 2. Validate permissions before creating new thread
    const allowed = await this.canInitiateMessage(senderId, recipientId, familyId);
    if (!allowed) {
      throw new ForbiddenException(
        'Direct messaging restricted: Members cannot message the Sanctuary Owner directly, and can only message relatives who added them or share an active relationship.',
      );
    }

    // 3. Create conversation and participant records
    return this.prisma.conversation.create({
      data: {
        familyId,
        type: 'DIRECT',
        participants: {
          create: [{ userId: senderId }, { userId: recipientId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
            },
          },
        },
      },
    });
  }

  /**
   * Fetch user's conversation threads in the family
   */
  async getUserConversations(userId: string, familyId: string) {
    const list = await this.prisma.conversation.findMany({
      where: {
        familyId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
            },
          },
        },
      },
      orderBy: {
        lastSenderAt: 'desc',
      },
    });

    // Format for client UI
    return list.map((conv) => {
      const myPart = conv.participants.find((p) => p.userId === userId);
      const otherPart = conv.participants.find((p) => p.userId !== userId);
      return {
        id: conv.id,
        familyId: conv.familyId,
        type: conv.type,
        title: conv.title || otherPart?.user?.fullName || 'Family Chat',
        lastMessage: conv.lastMessage || 'Start a conversation...',
        lastMessageTime: conv.lastSenderAt,
        unreadCount: myPart?.unreadCount || 0,
        otherUser: otherPart?.user || null,
        participants: conv.participants,
      };
    });
  }

  /**
   * Fetch message history for a conversation
   */
  async getConversationMessages(conversationId: string, userId: string) {
    // Verify user is in this conversation
    const isMember = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this conversation.');
    }

    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Save a message and notify participants
   */
  async saveMessage(senderId: string, dto: SendChatMessageDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { fullName: true, avatarUrl: true },
    });

    if (!user) throw new NotFoundException('User not found');

    // Verify sender belongs to conversation
    const isMember = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: senderId,
        },
      },
    });

    if (!isMember) {
      throw new ForbiddenException('Sender is not a participant in this conversation.');
    }

    // 1. Create chat message
    const msg = await this.prisma.chatMessage.create({
      data: {
        conversationId: dto.conversationId,
        senderId,
        senderName: user.fullName,
        avatar: user.avatarUrl,
        text: dto.text,
        mediaUrl: dto.mediaUrl,
        status: 'SENT',
      },
    });

    // 2. Update conversation last message timestamp
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: {
        lastMessage: dto.text,
        lastSenderAt: new Date(),
      },
    });

    // 3. Increment unread count for other participants
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId: dto.conversationId,
        userId: { not: senderId },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    return msg;
  }

  /**
   * Mark all messages in conversation as read
   */
  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });

    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
      },
    });

    return { success: true };
  }

  private async isOwnerOrAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  }

  /**
   * Edit / update an existing chat message
   */
  async updateMessage(messageId: string, userId: string, dto: UpdateChatMessageDto) {
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!msg) {
      throw new NotFoundException(`Message #${messageId} not found`);
    }

    const isAdmin = await this.isOwnerOrAdmin(userId);
    if (msg.senderId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updated = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        text: dto.text,
        ...(dto.mediaUrl !== undefined ? { mediaUrl: dto.mediaUrl } : {}),
      },
    });

    // Check if this was the latest message in conversation and refresh lastMessage text
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: msg.conversationId },
    });
    if (conversation) {
      const latestMsg = await this.prisma.chatMessage.findFirst({
        where: { conversationId: msg.conversationId },
        orderBy: { createdAt: 'desc' },
      });
      if (latestMsg && latestMsg.id === messageId) {
        await this.prisma.conversation.update({
          where: { id: msg.conversationId },
          data: { lastMessage: dto.text },
        });
      }
    }

    return updated;
  }

  /**
   * Delete an existing chat message
   */
  async deleteMessage(messageId: string, userId: string) {
    const msg = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!msg) {
      return { success: true, message: 'Message already deleted or not found' };
    }

    const isAdmin = await this.isOwnerOrAdmin(userId);
    if (msg.senderId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own messages unless you are an administrator');
    }

    await this.prisma.chatMessage.delete({
      where: { id: messageId },
    });

    // Refresh conversation lastMessage if needed
    const latestMsg = await this.prisma.chatMessage.findFirst({
      where: { conversationId: msg.conversationId },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.conversation.update({
      where: { id: msg.conversationId },
      data: {
        lastMessage: latestMsg ? latestMsg.text : 'No messages',
        lastSenderAt: latestMsg ? latestMsg.createdAt : new Date(),
      },
    });

    return { success: true, deletedId: messageId, conversationId: msg.conversationId };
  }

  /**
   * Delete an entire conversation thread
   */
  async deleteConversation(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conv) {
      return { success: true, message: 'Conversation already deleted or not found' };
    }

    const isParticipant = conv.participants.some((p) => p.userId === userId);
    const isAdmin = await this.isOwnerOrAdmin(userId);

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this conversation');
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true, deletedId: conversationId };
  }
}

