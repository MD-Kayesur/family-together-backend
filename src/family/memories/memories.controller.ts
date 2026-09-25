import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { MemoriesService } from './memories.service';
import { CreateMemoryDto, UpdateMemoryDto, MemoriesQueryDto, MemoryAccessQueryDto } from './memories.dto';

@ApiTags('Memories Vault')
@Controller('family/memories')
export class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get family memories gallery with user privacy isolation [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`GET /family/memories\`
**Purpose:** Retrieves timeline memories, stories, and photo archives with pagination and search. Strictly enforces user-level privacy isolation: each user only sees and accesses their own memories.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Authenticated user identity required (\`userId\` or \`userEmail\`). Returns an empty collection if unauthenticated to prevent data leaks.`,
  })
  @ApiResponse({ status: 200, description: 'Paginated user memories returned' })
  getMemories(@Query() query: MemoriesQueryDto) {
    return this.memoriesService.getMemories(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single family memory by ID with ownership verification [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`GET /family/memories/:id\`
**Purpose:** Retrieves the full record of a specific memory including rich descriptions, location, date, and media attachments. Enforces strict privacy isolation: only the author who added the memory can access it.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Access restricted to the creator/owner of the memory. Rejects requests from other users with 403 Forbidden.`,
  })
  @ApiParam({ name: 'id', description: 'Unique memory identifier' })
  @ApiResponse({ status: 200, description: 'Memory details retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Access denied to another user\'s private memory' })
  @ApiResponse({ status: 404, description: 'Memory record not found' })
  getMemoryById(
    @Param('id') id: string,
    @Query() access: MemoryAccessQueryDto,
  ) {
    return this.memoriesService.getMemoryById(id, access);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a new family memory story with photos, dates, and locations [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`POST /family/memories\`
**Purpose:** Allows family members to create and preserve moments, historical milestones, photos, and stories in their private sanctuary vault.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Any authenticated family member can create a memory. Strictly requires and binds \`userId\` and \`userEmail\` so that the memory is privately isolated to the author.`,
  })
  @ApiResponse({ status: 201, description: 'Memory created successfully' })
  @ApiResponse({ status: 400, description: 'User identity required to create memory' })
  createMemory(@Body() body: CreateMemoryDto) {
    return this.memoriesService.createMemory(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing family memory with ownership check [Roles: MEMBER (Author), OWNER, ADMIN]',
    description: `**Route:** \`PATCH /family/memories/:id\`
**Purpose:** Modifies details, stories, captions, or photos of a previously published memory. Enforces user ownership check.
**Allowed Roles:** Memory Author (\`MEMBER\` / \`USER\`), \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Edit permission strictly restricted to the original author. Another user cannot modify it.`,
  })
  @ApiParam({ name: 'id', description: 'Unique memory identifier' })
  @ApiResponse({ status: 200, description: 'Memory updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cannot edit another user\'s memory' })
  updateMemory(
    @Param('id') id: string,
    @Body() body: UpdateMemoryDto,
    @Query() access: MemoryAccessQueryDto,
  ) {
    return this.memoriesService.updateMemory(id, body, access);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a family memory by ID with ownership verification [Roles: MEMBER (Author), OWNER, ADMIN]',
    description: `**Route:** \`DELETE /family/memories/:id\`
**Purpose:** Permanently deletes a memory record and its media attachments from the sanctuary vault. Enforces user ownership.
**Allowed Roles:** Memory Author (\`MEMBER\` / \`USER\`), \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Delete permission strictly restricted to the original author. Another user cannot delete it.`,
  })
  @ApiParam({ name: 'id', description: 'Unique memory identifier' })
  @ApiResponse({ status: 200, description: 'Memory deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Cannot delete another user\'s memory' })
  deleteMemory(
    @Param('id') id: string,
    @Query() access: MemoryAccessQueryDto,
  ) {
    return this.memoriesService.deleteMemory(id, access);
  }
}

