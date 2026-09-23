import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginatedResponse } from '../../common/interfaces/paginated-result.interface';
import { CreateMemoryDto, UpdateMemoryDto, MemoriesQueryDto } from './memories.dto';

@Injectable()
export class MemoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private parseMediaUrls(mediaUrl: string | null): string[] {
    if (!mediaUrl) return [];
    try {
      const trimmed = mediaUrl.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => typeof item === 'string' && item.length > 0);
        }
      }
      return [trimmed];
    } catch {
      return [mediaUrl];
    }
  }

  private async processMediaResiliently(mediaUrls?: string[], singleMediaUrl?: string): Promise<string[]> {
    const rawList: string[] = [];

    if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      rawList.push(...mediaUrls.filter((u) => typeof u === 'string' && u.trim().length > 0));
    } else if (singleMediaUrl && singleMediaUrl.trim().length > 0) {
      rawList.push(...this.parseMediaUrls(singleMediaUrl));
    }

    if (rawList.length === 0) return [];

    // Process multiple media items with Promise.race and try/catch isolation
    // If any single media item fails or times out, the other items are safely preserved and added
    const results = await Promise.allSettled(
      rawList.map(async (itemUrl) => {
        try {
          return await Promise.race([
            Promise.resolve(itemUrl.trim()),
            new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error('Media validation timeout')), 4000),
            ),
          ]);
        } catch (err) {
          console.warn(`[Promise.race] Media item failed or timed out, continuing with remaining items:`, err);
          return null;
        }
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<string | null> => r.status === 'fulfilled' && !!r.value)
      .map((r) => r.value as string);
  }

  async getMemories(query?: MemoriesQueryDto) {
    try {
      const page = Math.max(1, Number(query?.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
      const skip = (page - 1) * limit;
      const searchTerm = (query?.search || query?.q || '').trim();

      // Strict privacy isolation: Return empty result if no user identity is provided to prevent memory leaks
      if (!query?.userId && !query?.userEmail) {
        if (query?.raw === true || query?.paginate === false) return [];
        return buildPaginatedResponse([], 0, page, limit);
      }

      const whereClause: any = {
        OR: [
          ...(query.userId ? [{ userId: query.userId }] : []),
          ...(query.userEmail
            ? [{ userEmail: { equals: query.userEmail, mode: 'insensitive' } }]
            : []),
        ],
      };

      if (searchTerm) {
        whereClause.AND = [
          {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
              { sharedBy: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        ];
      }

      if (query?.category) {
        const categoryCond = { description: { contains: `Category: ${query.category}`, mode: 'insensitive' } };
        if (whereClause.AND) {
          whereClause.AND.push(categoryCond);
        } else {
          whereClause.AND = [categoryCond];
        }
      }

      const sortField = query?.sortBy || 'createdAt';
      const sortDir = (query?.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
      const orderBy: any = { [sortField]: sortDir };

      const total = await this.prisma.memory.count({ where: whereClause });

      if (query?.raw === true || query?.paginate === false) {
        const memories = await this.prisma.memory.findMany({
          where: whereClause,
          orderBy,
        });

        return memories.map((mem) => {
          const mediaUrls = this.parseMediaUrls(mem.mediaUrl);
          return {
            ...mem,
            mediaUrls,
            mediaUrl: mediaUrls[0] || mem.mediaUrl || null,
          };
        });
      }

      const memories = await this.prisma.memory.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
      });

      const mapped = memories.map((mem) => {
        const mediaUrls = this.parseMediaUrls(mem.mediaUrl);
        return {
          ...mem,
          mediaUrls,
          mediaUrl: mediaUrls[0] || mem.mediaUrl || null,
        };
      });

      return buildPaginatedResponse(mapped, total, page, limit);
    } catch (err) {
      console.error('Error in getMemories:', err);
      throw err;
    }
  }

  async createMemory(data: CreateMemoryDto) {
    try {
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

      // Process multiple media items with resilient Promise.race / try-catch
      const resolvedMediaUrls = await this.processMediaResiliently(data.mediaUrls, data.mediaUrl);
      const storedMediaUrl =
        resolvedMediaUrls.length > 0 ? JSON.stringify(resolvedMediaUrls) : data.mediaUrl || null;

      const created = await this.prisma.memory.create({
        data: {
          familyId: family?.id || 'default',
          userId: data.userId || null,
          userEmail: data.userEmail || null,
          title: data.title,
          description: combinedDesc,
          sharedBy: data.sharedBy || 'Family Member',
          mediaUrl: storedMediaUrl,
          photoCount: resolvedMediaUrls.length > 0 ? resolvedMediaUrls.length : 1,
        },
      });

      return {
        ...created,
        mediaUrls: resolvedMediaUrls,
        mediaUrl: resolvedMediaUrls[0] || created.mediaUrl || null,
      };
    } catch (err) {
      console.error('Error in createMemory:', err);
      throw err;
    }
  }

  async getMemoryById(id: string) {
    try {
      const memory = await this.prisma.memory.findUnique({
        where: { id },
      });
      if (!memory) {
        throw new NotFoundException(`Memory with ID ${id} not found`);
      }

      const mediaUrls = this.parseMediaUrls(memory.mediaUrl);
      return {
        ...memory,
        mediaUrls,
        mediaUrl: mediaUrls[0] || memory.mediaUrl || null,
      };
    } catch (err) {
      console.error(`Error in getMemoryById (${id}):`, err);
      throw err;
    }
  }

  async updateMemory(id: string, data: UpdateMemoryDto) {
    try {
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

      let storedMediaUrl = memory.mediaUrl;
      let resolvedMediaUrls: string[] = memory.mediaUrls || [];

      if (data.mediaUrls !== undefined || data.mediaUrl !== undefined) {
        resolvedMediaUrls = await this.processMediaResiliently(data.mediaUrls, data.mediaUrl);
        storedMediaUrl =
          resolvedMediaUrls.length > 0 ? JSON.stringify(resolvedMediaUrls) : data.mediaUrl || null;
      }

      const updated = await this.prisma.memory.update({
        where: { id },
        data: {
          title: data.title !== undefined ? data.title : memory.title,
          description: combinedDesc || memory.description,
          sharedBy: data.sharedBy !== undefined ? data.sharedBy : memory.sharedBy,
          mediaUrl: storedMediaUrl,
          photoCount: resolvedMediaUrls.length > 0 ? resolvedMediaUrls.length : memory.photoCount || 1,
        },
      });

      return {
        ...updated,
        mediaUrls: resolvedMediaUrls,
        mediaUrl: resolvedMediaUrls[0] || updated.mediaUrl || null,
      };
    } catch (err) {
      console.error(`Error in updateMemory (${id}):`, err);
      throw err;
    }
  }

  async deleteMemory(id: string) {
    await this.getMemoryById(id);
    await this.prisma.memory.delete({
      where: { id },
    });
    return { success: true, message: 'Memory deleted successfully' };
  }
}
