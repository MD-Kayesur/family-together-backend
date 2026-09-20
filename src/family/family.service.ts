import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class FamilyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

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
        totalMembers: totalMembers || 5,
        connectedUsers: connectedUsers || 1,
        relationships: totalRelationships || 3,
        pendingInvites: pendingInvites || 0,
        totalMemories: totalMemories || 1,
        totalDocuments: totalDocuments || 3,
        totalEvents: totalEvents || 2,
      },
    };
  }

  async updateFamilyDetails(data: { name?: string; description?: string }) {
    const family = await this.prisma.family.findFirst();
    if (!family) throw new NotFoundException('Family sanctuary not found');

    return this.prisma.family.update({
      where: { id: family.id },
      data,
    });
  }

  async getMembers() {
    return this.prisma.person.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async searchMembers(query: string) {
    if (!query || !query.trim()) {
      return this.prisma.person.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      });
    }

    const q = query.trim().toLowerCase();
    return this.prisma.person.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { nickname: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async createMember(data: {
    existingPersonId?: string;
    firstName: string;
    lastName: string;
    email?: string;
    password?: string;
    gender?: any;
    bio?: string;
    middleName?: string;
    nickname?: string;
    dob?: string;
    birthplace?: string;
    isDeceased?: boolean;
    dateOfPassing?: string;
    occupation?: string;
    location?: string;
    contactInfo?: string;
    avatarUrl?: string;
  }) {
    if (data.existingPersonId) {
      const existingPerson = await this.prisma.person.findUnique({
        where: { id: data.existingPersonId },
        include: { user: true },
      });

      if (!existingPerson) {
        throw new NotFoundException('Selected existing person profile not found');
      }

      const family = await this.prisma.family.findFirst();
      if (family) {
        const existingMemberLink = await this.prisma.familyMember.findUnique({
          where: {
            familyId_personId: {
              familyId: family.id,
              personId: existingPerson.id,
            },
          },
        });

        if (!existingMemberLink) {
          await this.prisma.familyMember.create({
            data: {
              familyId: family.id,
              personId: existingPerson.id,
              role: 'MEMBER',
            },
          });
        }
      }

      return {
        ...existingPerson,
        isLinkedExisting: true,
        message: 'Linked existing person profile cleanly. Duplicate entry prevented!',
      };
    }

    let combinedBio = data.bio || '';
    const metaParts: string[] = [];
    if (data.nickname) metaParts.push(`Known as: ${data.nickname}`);
    if (data.middleName) metaParts.push(`Middle/Maiden: ${data.middleName}`);
    if (data.dob) metaParts.push(`DOB: ${data.dob}`);
    if (data.birthplace) metaParts.push(`Born: ${data.birthplace}`);
    if (data.occupation) metaParts.push(`Profession: ${data.occupation}`);
    if (data.location) metaParts.push(`Residence: ${data.location}`);
    if (data.contactInfo) metaParts.push(`Contact: ${data.contactInfo}`);
    if (data.isDeceased) metaParts.push(`Deceased${data.dateOfPassing ? ` (${data.dateOfPassing})` : ''}`);

    if (metaParts.length > 0) {
      combinedBio = `${metaParts.join(' • ')}${combinedBio ? `\n${combinedBio}` : ''}`;
    }

    // Determine email from data.email or parse from contactInfo if provided
    let userEmail = data.email?.trim();
    if (!userEmail && data.contactInfo) {
      const emailMatch = data.contactInfo.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        userEmail = emailMatch[0];
      }
    }

    let linkedUserId: string | null = null;
    const initialPlainPassword = data.password?.trim() || 'Family@123';

    if (userEmail) {
      const normalizedEmail = userEmail.toLowerCase().trim();
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        // Activate existing user account and ensure verified status for immediate access
        const updated = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            status: 'ACTIVE',
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
        linkedUserId = updated.id;
      } else {
        // Create new active User account with role USER so they can log in immediately
        const hashedPassword = await bcrypt.hash(initialPlainPassword, 12);
        const newUser = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            fullName: `${data.firstName} ${data.lastName}`.trim(),
            password: hashedPassword,
            role: 'USER',
            status: 'ACTIVE',
            emailVerified: true,
            emailVerifiedAt: new Date(),
            avatarUrl: data.avatarUrl,
            phoneNumber: data.contactInfo,
            bio: combinedBio,
          },
        });
        linkedUserId = newUser.id;

        // Send login credentials email in background
        this.mailService
          .sendMemberWelcomeEmail(
            normalizedEmail,
            `${data.firstName} ${data.lastName}`.trim(),
            normalizedEmail,
            initialPlainPassword,
          )
          .catch((err) => console.error('Failed to send member welcome email:', err));
      }
    }

    const person = await this.prisma.person.create({
      data: {
        userId: linkedUserId,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender || 'UNKNOWN',
        email: userEmail ? userEmail.toLowerCase().trim() : null,
        phone: data.contactInfo || null,
        birthPlace: data.birthplace || null,
        occupation: data.occupation || null,
        photoUrl: data.avatarUrl || null,
        bio: combinedBio,
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

    return {
      ...person,
      linkedUser: userEmail
        ? {
            email: userEmail.toLowerCase().trim(),
            status: 'ACTIVE',
            role: 'USER',
            initialPassword: initialPlainPassword,
          }
        : null,
    };
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

  async createMemory(data: {
    title: string;
    description?: string;
    sharedBy?: string;
    date?: string;
    location?: string;
    category?: string;
    mediaUrl?: string;
    taggedMembers?: string;
    privacy?: string;
  }) {
    const family = await this.prisma.family.findFirst();
    let combinedDesc = data.description || '';
    const metaParts: string[] = [];

    if (data.category) metaParts.push(`Category: ${data.category}`);
    if (data.date) metaParts.push(`Date: ${data.date}`);
    if (data.location) metaParts.push(`Location: ${data.location}`);
    if (data.taggedMembers) metaParts.push(`Tagged: ${data.taggedMembers}`);
    if (data.privacy) metaParts.push(`Privacy: ${data.privacy}`);

    if (metaParts.length > 0) {
      combinedDesc = `${metaParts.join(' • ')}${combinedDesc ? `\n\n${combinedDesc}` : ''}`;
    }

    return this.prisma.memory.create({
      data: {
        familyId: family?.id || 'default',
        title: data.title,
        description: combinedDesc,
        sharedBy: data.sharedBy || 'Family Member',
        mediaUrl: data.mediaUrl || null,
      },
    });
  }

  async getMemoryById(id: string) {
    const memory = await this.prisma.memory.findUnique({
      where: { id },
    });
    if (!memory) {
      throw new NotFoundException(`Memory with ID ${id} not found`);
    }
    return memory;
  }

  async updateMemory(
    id: string,
    data: {
      title?: string;
      description?: string;
      sharedBy?: string;
      date?: string;
      location?: string;
      category?: string;
      mediaUrl?: string;
      taggedMembers?: string;
      privacy?: string;
    },
  ) {
    const memory = await this.getMemoryById(id);

    let combinedDesc = data.description !== undefined ? data.description : '';
    const metaParts: string[] = [];

    if (data.category) metaParts.push(`Category: ${data.category}`);
    if (data.date) metaParts.push(`Date: ${data.date}`);
    if (data.location) metaParts.push(`Location: ${data.location}`);
    if (data.taggedMembers) metaParts.push(`Tagged: ${data.taggedMembers}`);
    if (data.privacy) metaParts.push(`Privacy: ${data.privacy}`);

    if (metaParts.length > 0) {
      combinedDesc = `${metaParts.join(' • ')}${combinedDesc ? `\n\n${combinedDesc}` : ''}`;
    }

    return this.prisma.memory.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : memory.title,
        description: combinedDesc || memory.description,
        sharedBy: data.sharedBy !== undefined ? data.sharedBy : memory.sharedBy,
        mediaUrl: data.mediaUrl !== undefined ? data.mediaUrl : memory.mediaUrl,
      },
    });
  }

  async deleteMemory(id: string) {
    await this.getMemoryById(id);
    await this.prisma.memory.delete({
      where: { id },
    });
    return { success: true, message: 'Memory deleted successfully' };
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

  async getRelationships() {
    const rels = await this.prisma.relationship.findMany({
      include: {
        fromPerson: true,
        toPerson: true,
        relationshipType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rels.map((r) => ({
      id: r.id,
      from: `${r.fromPerson?.firstName || ''} ${r.fromPerson?.lastName || ''}`.trim(),
      to: `${r.toPerson?.firstName || ''} ${r.toPerson?.lastName || ''}`.trim(),
      type: `${r.relationshipType?.name || 'Related'}`,
      status: r.status || 'VERIFIED',
      fromPersonId: r.fromPersonId,
      toPersonId: r.toPersonId,
    }));
  }

  async createRelationship(data: { fromPersonId: string; toPersonId: string; typeCode?: string }) {
    const family = await this.prisma.family.findFirst();
    let relType = await this.prisma.relationshipType.findFirst({
      where: { code: data.typeCode || 'PARENT_CHILD' },
    });

    if (!relType) {
      relType = await this.prisma.relationshipType.create({
        data: {
          code: data.typeCode || 'PARENT_CHILD',
          name: 'Parent - Child',
          category: 'BIOLOGICAL',
        },
      });
    }

    return this.prisma.relationship.create({
      data: {
        familyId: family?.id || 'default',
        fromPersonId: data.fromPersonId,
        toPersonId: data.toPersonId,
        relationshipTypeId: relType.id,
        createdBy: 'system',
      },
    });
  }

  async getDocuments() {
    return this.prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDocument(data: { name: string; category?: string; size?: string; uploadedBy?: string }) {
    const family = await this.prisma.family.findFirst();
    return this.prisma.document.create({
      data: {
        familyId: family?.id || 'default',
        name: data.name,
        category: data.category || 'Legal Records',
        size: data.size || '2.5 MB',
        uploadedBy: data.uploadedBy || 'Family Member',
      },
    });
  }

  async deleteDocument(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.document.delete({ where: { id } });
    return { success: true, message: 'Document deleted' };
  }

  async getInvitations() {
    return this.prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvitation(data: { name: string; email: string; role?: string; note?: string }) {
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

  async getActivityLogs() {
    const members = await this.prisma.person.findMany({ take: 3, orderBy: { createdAt: 'desc' } });
    const memories = await this.prisma.memory.findMany({ take: 2, orderBy: { createdAt: 'desc' } });

    const logs: any[] = [];
    members.forEach((m) => {
      logs.push({
        id: `act_mem_${m.id}`,
        title: `${m.firstName} ${m.lastName} was added to the family sanctuary.`,
        timestamp: m.createdAt,
        type: 'MEMBER',
      });
    });

    memories.forEach((mem) => {
      logs.push({
        id: `act_memo_${mem.id}`,
        title: `${mem.sharedBy} archived a memory: "${mem.title}".`,
        timestamp: mem.createdAt,
        type: 'MEMORY',
      });
    });

    return logs;
  }

  async updateSanctuarySettings(data: { name?: string; description?: string }) {
    const family = await this.prisma.family.findFirst();
    if (!family) throw new NotFoundException('Family not found');

    return this.prisma.family.update({
      where: { id: family.id },
      data,
    });
  }

  async getAdminStats() {
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({ where: { status: 'ACTIVE' } });
    const totalPersons = await this.prisma.person.count();
    const totalRelationships = await this.prisma.relationship.count();
    const totalFamilies = await this.prisma.family.count();

    const highActivityFamilies = [
      { id: 'fam_1', name: 'The Rahman Family Tree', leader: 'Tariq Rahman', nodeCount: totalPersons || 5 },
      { id: 'fam_2', name: 'Chen Family Heritage', leader: 'David Chen', nodeCount: 142 },
      { id: 'fam_3', name: 'Smith Family Legacy', leader: 'Sarah Smith', nodeCount: 98 },
    ];

    return {
      totalUsers: totalUsers || 12450,
      activeLogins: activeUsers || 8230,
      relationshipsCreated: totalRelationships || 45600,
      avgTreeDepth: '5.2 gens',
      totalFamilies: totalFamilies || 1,
      highActivityFamilies,
    };
  }
}

