import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginatedResponse } from '../../common/interfaces/paginated-result.interface';
import { CreateRelationshipDto, RelationshipsQueryDto } from './relationships.dto';

@Injectable()
export class RelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRelationships(query?: RelationshipsQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;
    const searchTerm = (query?.search || query?.q || '').trim();

    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { fromPerson: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
        { fromPerson: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
        { toPerson: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
        { toPerson: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
        { relationshipType: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { relationshipType: { code: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    if (query?.status) {
      where.status = query.status.toUpperCase() as any;
    }

    if (query?.personId) {
      const pId = query.personId;
      const pCondition = [{ fromPersonId: pId }, { toPersonId: pId }];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: pCondition }];
        delete where.OR;
      } else {
        where.OR = pCondition;
      }
    }

    const sortField = query?.sortBy || 'createdAt';
    const sortDir = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: any = { [sortField]: sortDir };

    const total = await this.prisma.relationship.count({ where });

    const mapRel = (r: any) => ({
      id: r.id,
      from: `${r.fromPerson?.firstName || ''} ${r.fromPerson?.lastName || ''}`.trim(),
      to: `${r.toPerson?.firstName || ''} ${r.toPerson?.lastName || ''}`.trim(),
      type: `${r.relationshipType?.name || 'Related'}`,
      status: r.status || 'VERIFIED',
      fromPersonId: r.fromPersonId,
      toPersonId: r.toPersonId,
    });

    if (query?.raw === true || query?.paginate === false) {
      const rels = await this.prisma.relationship.findMany({
        where,
        include: { fromPerson: true, toPerson: true, relationshipType: true },
        orderBy,
      });
      return rels.map(mapRel);
    }

    const rels = await this.prisma.relationship.findMany({
      where,
      skip,
      take: limit,
      include: { fromPerson: true, toPerson: true, relationshipType: true },
      orderBy,
    });

    return buildPaginatedResponse(rels.map(mapRel), total, page, limit);
  }

  async createRelationship(data: CreateRelationshipDto) {
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
}
