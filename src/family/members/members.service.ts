import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RelationshipsService } from '../relationships/relationships.service';
import * as bcrypt from 'bcryptjs';
import { buildPaginatedResponse } from '../../common/interfaces/paginated-result.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateMemberDto, UpdateMemberDto, MembersQueryDto } from './members.dto';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => RelationshipsService))
    private readonly relationshipsService: RelationshipsService,
  ) {}

  async getMembers(query?: MembersQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;
    const searchTerm = (query?.search || query?.q || '').trim();

    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { middleName: { contains: searchTerm, mode: 'insensitive' } },
        { nickname: { contains: searchTerm, mode: 'insensitive' } },
        { bio: { contains: searchTerm, mode: 'insensitive' } },
        { occupation: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { birthPlace: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (query?.gender) {
      where.gender = { equals: query.gender.toUpperCase() as any };
    }

    if (query?.isDeceased !== undefined) {
      if (query.isDeceased === true || (query.isDeceased as any) === 'true') {
        where.bio = { contains: 'Deceased', mode: 'insensitive' };
      }
    }

    const sortField = query?.sortBy || 'createdAt';
    const sortDir = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: any = { [sortField]: sortDir };

    const total = await this.prisma.person.count({ where });

    if (query?.raw === true || query?.paginate === false) {
      return this.prisma.person.findMany({
        where,
        include: {
          user: true,
          fromRelationships: { include: { toPerson: true, relationshipType: true } },
          toRelationships: { include: { fromPerson: true, relationshipType: true } },
        },
        orderBy,
      });
    }

    const members = await this.prisma.person.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: true,
        fromRelationships: { include: { toPerson: true, relationshipType: true } },
        toRelationships: { include: { fromPerson: true, relationshipType: true } },
      },
      orderBy,
    });

    return buildPaginatedResponse(members, total, page, limit);
  }

  async searchMembers(queryParam: PaginationQueryDto | string) {
    const q = typeof queryParam === 'string' ? queryParam : queryParam?.q || queryParam?.search || '';
    const queryDto: MembersQueryDto = typeof queryParam === 'object' ? queryParam : { search: q };
    return this.getMembers({ ...queryDto, search: q });
  }

  async createMember(data: CreateMemberDto) {
    // If linking an existing person by ID
    if (data.existingPersonId) {
      const existingPerson = await this.prisma.person.findUnique({
        where: { id: data.existingPersonId },
      });

      if (!existingPerson) {
        throw new NotFoundException('Specified person record not found');
      }

      const family = await this.prisma.family.findFirst();
      if (family) {
        const existingMemberLink = await this.prisma.familyMember.findFirst({
          where: {
            familyId: family.id,
            personId: existingPerson.id,
          },
        });

        if (!existingMemberLink) {
          await this.prisma.familyMember.create({
            data: {
              familyId: family.id,
              personId: existingPerson.id,
              role: (data.roleInFamily?.toUpperCase() as any) || 'MEMBER',
            },
          });
        }
      }

      // Also establish relationship if relativeToPersonId is provided
      if (data.relativeToPersonId) {
        try {
          await this.linkRelativeRelationship(
            data.relativeToPersonId,
            existingPerson.id,
            data.relationshipType,
          );
        } catch (relErr) {
          console.error('Failed to link relationship for existing person:', relErr);
        }
      }

      return existingPerson;
    }

    // Creating a new Person record
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
      combinedBio = `${metaParts.join(' • ')}${combinedBio ? `\n\n${combinedBio}` : ''}`;
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
        gender: (data.gender?.toUpperCase() as any) || 'UNKNOWN',
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
          role: (data.roleInFamily?.toUpperCase() as any) || 'MEMBER',
        },
      });
    }

    // Automatically establish relationship if relativeToPersonId is provided
    if (data.relativeToPersonId) {
      try {
        await this.linkRelativeRelationship(
          data.relativeToPersonId,
          person.id,
          data.relationshipType,
        );
      } catch (relErr) {
        console.error('Failed to auto-create relationship for relative:', relErr);
      }
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

  private async linkRelativeRelationship(
    memberPersonId: string,
    relativePersonId: string,
    relationshipType?: string,
  ) {
    const relTypeNormalized = (relationshipType || 'PARENT_CHILD').toUpperCase().trim();
    let fromId = memberPersonId;
    let toId = relativePersonId;
    let typeCode = 'PARENT_CHILD';

    if (
      relTypeNormalized === 'FATHER' ||
      relTypeNormalized === 'MOTHER' ||
      relTypeNormalized === 'PARENT'
    ) {
      fromId = relativePersonId; // Relative is parent
      toId = memberPersonId;     // Current member is child
      typeCode = 'PARENT_CHILD';
    } else if (
      relTypeNormalized === 'SON' ||
      relTypeNormalized === 'DAUGHTER' ||
      relTypeNormalized === 'CHILD'
    ) {
      fromId = memberPersonId;   // Current member is parent
      toId = relativePersonId;   // Relative is child
      typeCode = 'PARENT_CHILD';
    } else if (
      relTypeNormalized === 'SPOUSE' ||
      relTypeNormalized === 'PARTNER' ||
      relTypeNormalized === 'HUSBAND' ||
      relTypeNormalized === 'WIFE'
    ) {
      fromId = memberPersonId;
      toId = relativePersonId;
      typeCode = 'SPOUSE';
    } else if (
      relTypeNormalized === 'BROTHER' ||
      relTypeNormalized === 'SISTER' ||
      relTypeNormalized === 'SIBLING'
    ) {
      fromId = memberPersonId;
      toId = relativePersonId;
      typeCode = 'SIBLING';
    } else {
      typeCode = relTypeNormalized;
    }

    return this.relationshipsService.createRelationship({
      fromPersonId: fromId,
      toPersonId: toId,
      typeCode,
    });
  }

  async updateMember(id: string, data: UpdateMemberDto) {
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

    await this.prisma.familyMember.deleteMany({ where: { personId: id } });
    await this.prisma.relationship.deleteMany({
      where: { OR: [{ fromPersonId: id }, { toPersonId: id }] },
    });

    await this.prisma.person.delete({ where: { id } });
    return { success: true, message: 'Member profile deleted successfully' };
  }
}
