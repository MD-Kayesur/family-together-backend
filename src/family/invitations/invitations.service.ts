import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginatedResponse } from '../../common/interfaces/paginated-result.interface';
import { CreateInvitationDto, InvitationsQueryDto } from './invitations.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvitations(query?: InvitationsQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;
    const searchTerm = (query?.search || query?.q || '').trim();

    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { role: { contains: searchTerm, mode: 'insensitive' } },
        { note: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (query?.status) {
      where.status = query.status.toUpperCase();
    }

    const sortField = query?.sortBy || 'createdAt';
    const sortDir = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: any = { [sortField]: sortDir };

    const total = await this.prisma.invitation.count({ where });

    if (query?.raw === true || query?.paginate === false) {
      return this.prisma.invitation.findMany({ where, orderBy });
    }

    const invitations = await this.prisma.invitation.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    });

    return buildPaginatedResponse(invitations, total, page, limit);
  }

  async createInvitation(data: CreateInvitationDto) {
    const family = await this.prisma.family.findFirst();
    return this.prisma.invitation.create({
      data: {
        familyId: family?.id || 'default',
        name: data.name,
        email: data.email,
        role: data.role || 'MEMBER',
        note: data.note || '',
        status: 'PENDING',
      },
    });
  }

  async updateInvitationStatus(id: string, status: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Invitation request not found');

    return this.prisma.invitation.update({
      where: { id },
      data: { status },
    });
  }

  async getInvitationById(id: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id },
      include: {
        family: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!invitation) throw new NotFoundException(`Invitation request #${id} not found`);
    return invitation;
  }

  async deleteInvitation(id: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { id } });
    if (!invitation) throw new NotFoundException(`Invitation request #${id} not found`);

    await this.prisma.invitation.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Invitation deleted successfully',
      id,
    };
  }
}
