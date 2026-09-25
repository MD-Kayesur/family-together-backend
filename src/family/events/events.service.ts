import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginatedResponse } from '../../common/interfaces/paginated-result.interface';
import { CreateEventDto, UpdateEventDto, EventsQueryDto } from './events.dto';

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

  async getEventById(id: string) {
    const event = await this.prisma.event.findUnique({
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

    if (!event) {
      throw new NotFoundException(`Family event #${id} not found`);
    }

    return event;
  }

  async createEvent(data: CreateEventDto) {
    const family = await this.prisma.family.findFirst();
    return this.prisma.event.create({
      data: {
        familyId: family?.id || 'default',
        title: data.title,
        date: new Date(data.date),
        location: data.location || '',
        description: data.description || '',
        isVirtual: data.isVirtual || false,
      },
    });
  }

  async updateEvent(id: string, data: UpdateEventDto) {
    await this.getEventById(id);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isVirtual !== undefined) updateData.isVirtual = data.isVirtual;

    return this.prisma.event.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteEvent(id: string) {
    await this.getEventById(id);

    await this.prisma.event.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Event deleted successfully',
      id,
    };
  }
}
