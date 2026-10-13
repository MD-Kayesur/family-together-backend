import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { buildPaginatedResponse } from '../../common/interfaces/paginated-result.interface';
import { BroadcastEmailDto, AnnouncementsQueryDto } from './announcements.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private async findUserSanctuary(userId?: string) {
    if (userId) {
      const family = await this.prisma.family.findFirst({
        where: {
          OR: [
            { createdBy: userId },
            {
              members: {
                some: {
                  person: { userId },
                  role: { in: ['OWNER', 'ADMIN'] as any },
                },
              },
            },
          ],
        },
      });
      if (family) return family;
    }
    // Fallback to primary sanctuary
    return this.prisma.family.findFirst();
  }

  async getEligibleRecipients(familyId: string, targetRole: string = 'ALL') {
    const members = await this.prisma.familyMember.findMany({
      where: {
        familyId,
        ...(targetRole && targetRole !== 'ALL'
          ? { role: targetRole.toUpperCase() as any }
          : {}),
      },
      include: {
        person: {
          include: { user: true },
        },
      },
    });

    const emailMap = new Map<string, { email: string; name: string; role: string; personId: string }>();

    for (const m of members) {
      const p = m.person;
      if (!p || p.isAlive === false) continue; // Skip deceased ancestors

      const targetEmail = (p.email || p.user?.email || '').trim().toLowerCase();
      if (targetEmail && targetEmail.includes('@') && !emailMap.has(targetEmail)) {
        emailMap.set(targetEmail, {
          personId: p.id,
          email: targetEmail,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Family Member',
          role: m.role,
        });
      }
    }

    return Array.from(emailMap.values());
  }

  async getRecipientsPreview(userId?: string) {
    const family = await this.findUserSanctuary(userId);
    if (!family) {
      return { totalCount: 0, recipients: [] };
    }

    const recipients = await this.getEligibleRecipients(family.id, 'ALL');
    return {
      totalCount: recipients.length,
      recipients: recipients.map((r) => ({
        personId: r.personId,
        name: r.name,
        email: r.email,
        role: r.role,
      })),
    };
  }

  async broadcastAnnouncement(currentUserId: string, dto: BroadcastEmailDto) {
    let currentUser: any = null;
    if (currentUserId) {
      currentUser = await this.prisma.user.findUnique({
        where: { id: currentUserId },
      });
    }

    if (!currentUser) {
      // Find default owner user
      currentUser = await this.prisma.user.findFirst({
        where: { role: 'OWNER' },
      });
    }

    if (!currentUser) {
      currentUser = await this.prisma.user.findFirst();
    }

    if (!currentUser) {
      throw new NotFoundException('Active sender user account not found');
    }

    const family = await this.findUserSanctuary(currentUser.id);
    if (!family) {
      throw new NotFoundException('Sanctuary not found for broadcasting announcements.');
    }

    const recipients = await this.getEligibleRecipients(
      family.id,
      dto.targetRole || 'ALL',
    );

    if (recipients.length === 0) {
      throw new BadRequestException(
        'No eligible family members with active email addresses found in this sanctuary.',
      );
    }

    const ownerInfo = {
      email: currentUser.email,
      name: currentUser.fullName || 'Sanctuary Owner',
    };

    const { totalSent, failed } = await this.mailService.broadcastFamilyAnnouncement(
      recipients,
      ownerInfo,
      dto.subject,
      dto.message,
      family.name,
      dto.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
    );

    // Save record to database
    const announcement = await this.prisma.announcement.create({
      data: {
        familyId: family.id,
        senderUserId: currentUser.id,
        senderName: currentUser.fullName,
        senderEmail: currentUser.email,
        subject: dto.subject,
        message: dto.message,
        totalRecipients: recipients.length,
        successfulSent: totalSent,
        failedCount: failed,
        targetRole: dto.targetRole || 'ALL',
        replyToEmail: currentUser.email,
      },
    });

    return {
      success: true,
      broadcastId: announcement.id,
      totalRecipients: recipients.length,
      totalSent,
      failed,
      replyToEmail: currentUser.email,
      message: `Announcement "${dto.subject}" successfully dispatched to ${totalSent} member inboxes. Direct replies will arrive in ${currentUser.email}.`,
    };
  }

  async getAnnouncementHistory(userId?: string, query?: AnnouncementsQueryDto) {
    const family = await this.findUserSanctuary(userId);
    if (!family) {
      return buildPaginatedResponse([], 0, 1, 10);
    }

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;
    const searchTerm = (query?.search || '').trim();

    const where: any = { familyId: family.id };
    if (searchTerm) {
      where.OR = [
        { subject: { contains: searchTerm, mode: 'insensitive' } },
        { message: { contains: searchTerm, mode: 'insensitive' } },
        { senderName: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.announcement.count({ where });
    const items = await this.prisma.announcement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return buildPaginatedResponse(items, total, page, limit);
  }

  async deleteAnnouncement(id: string) {
    const existing = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Announcement with ID "${id}" not found`);
    }

    await this.prisma.announcement.delete({ where: { id } });
    return { success: true, message: 'Announcement record deleted from history' };
  }
}
