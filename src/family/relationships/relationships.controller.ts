import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RelationshipsService } from './relationships.service';
import { CreateRelationshipDto, UpdateRelationshipDto, RelationshipsQueryDto } from './relationships.dto';

@ApiTags('Family Relationships')
@Controller('family/relationships')
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get full family relationships graph matrix with pagination and search [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`GET /family/relationships\`
**Purpose:** Retrieves bidirectional and directional edge links (parent, child, spouse, sibling) connecting family members with optional search by relative name or relation type and pagination.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read-only access to relationship connection matrix.`,
  })
  @ApiResponse({ status: 200, description: 'Relationship graph matrix retrieved successfully' })
  getRelationships(@Query() query: RelationshipsQueryDto) {
    return this.relationshipsService.getRelationships(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a relationship link between two relatives [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`POST /family/relationships\`
**Purpose:** Links two person nodes together by specifying directional relationship codes (e.g. FATHER, MOTHER, SPOUSE, CHILD, SIBLING).
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\`, \`USER\`
**Permissions:** Authorized relatives and sanctuary owners can construct tree branch links.`,
  })
  @ApiResponse({ status: 201, description: 'Relationship established successfully' })
  createRelationship(@Body() body: CreateRelationshipDto) {
    return this.relationshipsService.createRelationship(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing relationship link [Roles: OWNER, ADMIN, MEMBER]',
    description: `**Route:** \`PATCH /family/relationships/:id\`
**Purpose:** Modifies relationship type code (e.g. changing between PARENT_CHILD, SPOUSE, SIBLING) or verification status.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\``,
  })
  @ApiParam({ name: 'id', description: 'Unique relationship identifier' })
  @ApiResponse({ status: 200, description: 'Relationship updated successfully' })
  updateRelationship(
    @Param('id') id: string,
    @Body() body: UpdateRelationshipDto,
  ) {
    return this.relationshipsService.updateRelationship(id, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete and unlink a relationship connection [Roles: OWNER, ADMIN, MEMBER]',
    description: `**Route:** \`DELETE /family/relationships/:id\`
**Purpose:** Removes the relationship link between two relatives, disconnecting the tree branch edge.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\``,
  })
  @ApiParam({ name: 'id', description: 'Unique relationship identifier' })
  @ApiResponse({ status: 200, description: 'Relationship connection deleted successfully' })
  deleteRelationship(@Param('id') id: string) {
    return this.relationshipsService.deleteRelationship(id);
  }
}
