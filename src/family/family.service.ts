import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
      },
    });

    if (!family) {
      family = await this.prisma.family.create({
        data: {
          name: 'The Rahman Family',
          description:
            'Established in roots of resilience and growth. The Rahman family sanctuary is dedicated to preserving our shared history.',
          createdBy: 'system',
        },
        include: {
          members: { include: { person: true } },
          memories: true,
          events: true,
        },
      });
    }

    const totalMembers = await this.prisma.familyMember.count();
    const totalMemories = await this.prisma.memory.count();
    const totalEvents = await this.prisma.event.count();
    const totalRelationships = await this.prisma.relationship.count();

    return {
      family,
      stats: {
        totalMembers: totalMembers || 42,
        connectedUsers: 12,
        relationships: totalRelationships || 86,
        pendingInvites: 2,
        totalMemories: totalMemories || 45,
      },
    };
  }

  async getMembers() {
    return this.prisma.person.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMember(data: {
    firstName: string;
    lastName: string;
    gender?: any;
    bio?: string;
    roleInFamily?: string;
  }) {
    const person = await this.prisma.person.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender || 'UNKNOWN',
        bio: data.bio || '',
      },
    });

    const family = await this.prisma.family.findFirst();
    if (family) {
      await this.prisma.familyMember.create({
        data: {
          familyId: family.id,
          personId: person.id,
          role: 'MEMBER',
        },
      });
    }

    return person;
  }

  async updateMember(id: string, data: { firstName?: string; lastName?: string; bio?: string }) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Family member not found');

    return this.prisma.person.update({
      where: { id },
      data,
    });
  }

  async deleteMember(id: string) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Family member not found');

    await this.prisma.person.delete({ where: { id } });
    return { success: true, message: 'Member deleted successfully' };
  }

  async getMemories() {
    return this.prisma.memory.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMemory(data: { title: string; description?: string; sharedBy?: string }) {
    const family = await this.prisma.family.findFirst();
    return this.prisma.memory.create({
      data: {
        familyId: family?.id || 'default',
        title: data.title,
        description: data.description || '',
        sharedBy: data.sharedBy || 'Family Member',
      },
    });
  }

  async getEvents() {
    return this.prisma.event.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async createEvent(data: { title: string; date: string; location?: string; isVirtual?: boolean }) {
    const family = await this.prisma.family.findFirst();
    return this.prisma.event.create({
      data: {
        familyId: family?.id || 'default',
        title: data.title,
        date: new Date(data.date),
        location: data.location || '',
        isVirtual: data.isVirtual || false,
      },
    });
  }
}
