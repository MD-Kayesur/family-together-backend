import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginatedResponse } from '../../common/interfaces/paginated-result.interface';
import { CreateEventDto, EventsQueryDto } from './events.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvents(query?: EventsQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;
    const searchTerm = (query?.search || query?.q || '').trim();

    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { location: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (query?.isVirtual !== undefined) {
      where.isVirtual = query.isVirtual === true || query.isVirtual === 'true';
    }

    const sortField = query?.sortBy || 'date';
    const sortDir = (query?.sortOrder || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
    const orderBy: any = { [sortField]: sortDir };

    const total = await this.prisma.event.count({ where });

    if (query?.raw === true || query?.paginate === false) {
      return this.prisma.event.findMany({ where, orderBy });
    }

    const events = await this.prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    });

    return buildPaginatedResponse(events, total, page, limit);
  }

  async createEvent(data: CreateEventDto) {
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
