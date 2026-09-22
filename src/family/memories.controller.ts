import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Memories Vault')
@Controller('family/memories')
export class MemoriesController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({ summary: 'Get family memories gallery with user privacy isolation' })
  @ApiQuery({ name: 'userId', required: false, description: 'Optional user identifier for isolation' })
  @ApiQuery({ name: 'userEmail', required: false, description: 'Optional user email for isolation' })
  getMemories(
    @Query('userId') userId?: string,
    @Query('userEmail') userEmail?: string,
  ) {
    return this.familyService.getMemories({ userId, userEmail });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single family memory by ID' })
  @ApiParam({ name: 'id', description: 'Unique memory identifier' })
  getMemoryById(@Param('id') id: string) {
    return this.familyService.getMemoryById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new family memory story with photos, dates, and locations' })
  createMemory(
    @Body()
    body: {
      title: string;
      description?: string;
      sharedBy?: string;
      userId?: string;
      userEmail?: string;
      date?: string;
      location?: string;
      category?: string;
      mediaUrl?: string;
      mediaUrls?: string[];
      taggedMembers?: string;
      privacy?: string;
    },
  ) {
    return this.familyService.createMemory(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing family memory' })
  @ApiParam({ name: 'id', description: 'Unique memory identifier' })
  updateMemory(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      sharedBy?: string;
      date?: string;
      location?: string;
      category?: string;
      mediaUrl?: string;
      mediaUrls?: string[];
      taggedMembers?: string;
      privacy?: string;
    },
  ) {
    return this.familyService.updateMemory(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a family memory by ID' })
  @ApiParam({ name: 'id', description: 'Unique memory identifier' })
  deleteMemory(@Param('id') id: string) {
    return this.familyService.deleteMemory(id);
  }
}
