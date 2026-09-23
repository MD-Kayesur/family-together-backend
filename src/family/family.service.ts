import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginatedResponse } from '../common/interfaces/paginated-result.interface';
import { UpdateFamilyDetailsDto, UpdateSanctuarySettingsDto, ActivityQueryDto } from './family.dto';

@Injectable()
export class FamilyService {
  constructor(private readonly prisma: PrismaService) {}

  async getSanctuaryData() {
    let family = await this.prisma.family.findFirst({
      include: {
        members: {
          include: {
            person: true,
          },
        },
        memories: true,
        events: true,
        documents: true,
        invitations: true,
      },
    });

    if (!family) {
      family = await this.prisma.family.create({
        data: {
          name: 'The Rahman Family',
          description:
            'Established in roots of resilience and growth. The Rahman family sanctuary is dedicated to preserving our shared history, celebrating current milestones, and connecting generations across the globe.',
          createdBy: 'system',
        },
        include: {
          members: { include: { person: true } },
          memories: true,
          events: true,
          documents: true,
          invitations: true,
        },
      });
    }

    const totalMembers = await this.prisma.person.count();
    const connectedUsers = await this.prisma.user.count();
    const totalMemories = await this.prisma.memory.count();
    const totalEvents = await this.prisma.event.count();
    const totalRelationships = await this.prisma.relationship.count();
    const totalDocuments = await this.prisma.document.count();
    const pendingInvites = await this.prisma.invitation.count({ where: { status: 'PENDING' } });

    return {
      family,
      stats: {
        totalMembers: totalMembers,
        connectedUsers: connectedUsers,
        relationships: totalRelationships,
        pendingInvites: pendingInvites,
        totalMemories: totalMemories,
        totalDocuments: totalDocuments,
        totalEvents: totalEvents,
      },
    };
  }

  async updateFamilyDetails(data: UpdateFamilyDetailsDto) {
    const family = await this.prisma.family.findFirst();
    if (!family) throw new NotFoundException('Family sanctuary not found');

    return this.prisma.family.update({
      where: { id: family.id },
      data,
    });
  }

  async getActivityLogs(query?: ActivityQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;
    const searchTerm = (query?.search || query?.q || '').trim().toLowerCase();

    const [persons, memories, rels, docs] = await Promise.all([
      this.prisma.person.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.memory.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.relationship.findMany({
        take: 30,
        include: { fromPerson: true, toPerson: true, relationshipType: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.document.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const logs: any[] = [];

    persons.forEach((p) => {
      logs.push({
        id: `person-${p.id}`,
        title: `Added family profile: ${p.firstName} ${p.lastName}`,
        timestamp: p.createdAt,
        type: 'MEMBER_ADDED',
        user: p.firstName,
      });
    });

    memories.forEach((m) => {
      logs.push({
        id: `memory-${m.id}`,
        title: `Preserved new memory: "${m.title}"`,
        timestamp: m.createdAt,
        type: 'MEMORY_ADDED',
        user: m.sharedBy,
      });
    });

    rels.forEach((r) => {
      logs.push({
        id: `rel-${r.id}`,
        title: `Established relationship between ${r.fromPerson?.firstName || 'relative'} and ${r.toPerson?.firstName || 'relative'}`,
        timestamp: r.createdAt,
        type: 'RELATIONSHIP_CREATED',
        user: 'Sanctuary Node',
      });
    });

    docs.forEach((d) => {
      logs.push({
        id: `doc-${d.id}`,
        title: `Archived legal/historical document: "${d.name}" (${d.category})`,
        timestamp: d.createdAt,
        type: 'DOCUMENT_ARCHIVED',
        user: d.uploadedBy,
      });
    });

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let filteredLogs = logs;
    if (query?.type) {
      const typeFilter = query.type.toUpperCase();
      filteredLogs = filteredLogs.filter((l) => l.type.includes(typeFilter));
    }

    if (searchTerm) {
      filteredLogs = filteredLogs.filter(
        (l) =>
          l.title.toLowerCase().includes(searchTerm) ||
          (l.user && l.user.toLowerCase().includes(searchTerm)) ||
          l.type.toLowerCase().includes(searchTerm),
      );
    }

    const total = filteredLogs.length;

    if (query?.raw === true || query?.paginate === false) {
      return filteredLogs;
    }

    const paginated = filteredLogs.slice(skip, skip + limit);
    return buildPaginatedResponse(paginated, total, page, limit);
  }

  async updateSanctuarySettings(data: UpdateSanctuarySettingsDto) {
    const family = await this.prisma.family.findFirst();
    if (!family) throw new NotFoundException('Family not found');

    return this.prisma.family.update({
      where: { id: family.id },
      data,
    });
  }

  async getAdminStats() {
    const totalUsers = await this.prisma.user.count();
    const activeLogins = await this.prisma.user.count({ where: { status: 'ACTIVE' } });
    const relationshipsCreated = await this.prisma.relationship.count();
    const families = await this.prisma.family.findMany({
      include: {
        _count: {
          select: { members: true },
        },
      },
      take: 5,
    });

    return {
      totalUsers,
      activeLogins,
      relationshipsCreated,
      avgTreeDepth: '4.2',
      totalFamilies: families.length,
      highActivityFamilies: families.map((f) => ({
        id: f.id,
        name: f.name,
        leader: f.createdBy,
        nodeCount: f._count.members,
      })),
    };
  }
}
