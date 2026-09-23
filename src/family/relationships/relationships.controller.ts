import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RelationshipsService } from './relationships.service';
import { CreateRelationshipDto, RelationshipsQueryDto } from './relationships.dto';

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
}
