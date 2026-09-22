import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FamilyService } from './family.service';
import { MemoriesQueryDto } from './dto/family-query.dto';

@ApiTags('Memories Vault')
@Controller('family/memories')
export class MemoriesController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get family memories gallery with user privacy isolation, pagination, and keyword search',
    description: `**Purpose:** Retrieves timeline memories, stories, and photo archives with pagination and search. Strictly enforces privacy isolation: users only see their own memories or memories specifically shared with them.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Authenticated user identity required (\`userId\` or \`userEmail\`). Returns an empty collection if unauthenticated to prevent data leaks.`,
  })
  @ApiResponse({ status: 200, description: 'Paginated user memories returned' })
  getMemories(@Query() query: MemoriesQueryDto) {
    return this.familyService.getMemories(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single family memory by ID',
    description: `**Purpose:** Retrieves the full record of a specific memory including rich descriptions, location, date, and media attachments.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read permission for authorized family members.`,
  })
  @ApiParam({ name: 'id', description: 'Unique memory identifier' })
  @ApiResponse({ status: 200, description: 'Memory details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Memory record not found' })
  getMemoryById(@Param('id') id: string) {
    return this.familyService.getMemoryById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a new family memory story with photos, dates, and locations',
    description: `**Purpose:** Allows family members to create and preserve moments, historical milestones, photos, and stories in the sanctuary vault.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Any authorized family member can author and share memories. Automatically binds \`userId\` and \`userEmail\` to enforce ownership.`,
  })
  @ApiResponse({ status: 201, description: 'Memory created successfully' })
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
  @ApiOperation({
    summary: 'Update an existing family memory',
    description: `**Purpose:** Modifies details, stories, captions, or photos of a previously published memory.
**Allowed Roles:** Memory Author (\`MEMBER\` / \`USER\`), \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Edit permission restricted to original memory creator or sanctuary administrators.`,
  })
  @ApiParam({ name: 'id', description: 'Unique memory identifier' })
  @ApiResponse({ status: 200, description: 'Memory updated successfully' })
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
  @ApiOperation({
    summary: 'Delete a family memory by ID',
    description: `**Purpose:** Permanently deletes a memory record and its media attachments from the sanctuary vault.
**Allowed Roles:** Memory Author, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Delete permission restricted to the original author or sanctuary owner.`,
  })
  @ApiParam({ name: 'id', description: 'Unique memory identifier' })
  @ApiResponse({ status: 200, description: 'Memory deleted successfully' })
  deleteMemory(@Param('id') id: string) {
    return this.familyService.deleteMemory(id);
  }
}
