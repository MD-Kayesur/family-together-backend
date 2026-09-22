import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Family Relationships')
@Controller('family/relationships')
export class RelationshipsController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get full family relationships graph matrix for tree rendering',
    description: `**Purpose:** Retrieves all bidirectional and directional edge links (parent, child, spouse, sibling) connecting family members for rendering the interactive Family Tree canvas.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read-only access to relationship connection matrix.`,
  })
  @ApiResponse({ status: 200, description: 'Relationship graph matrix retrieved successfully' })
  getRelationships() {
    return this.familyService.getRelationships();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a relationship link between two relatives',
    description: `**Purpose:** Links two person nodes together by specifying directional relationship codes (e.g. FATHER, MOTHER, SPOUSE, CHILD, SIBLING).
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\`, \`USER\`
**Permissions:** Authorized relatives and sanctuary owners can construct tree branch links.`,
  })
  @ApiResponse({ status: 201, description: 'Relationship established successfully' })
  createRelationship(
    @Body() body: { fromPersonId: string; toPersonId: string; typeCode?: string },
  ) {
    return this.familyService.createRelationship(body);
  }
}
