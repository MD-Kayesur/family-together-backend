import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Family Members')
@Controller('family/members')
export class MembersController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all family members in the sanctuary',
    description: `**Purpose:** Retrieves complete member directory records, genealogical nodes, life dates, occupations, and profile pictures.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read permission for member directory.`,
  })
  @ApiResponse({ status: 200, description: 'List of family members returned' })
  getMembers() {
    return this.familyService.getMembers();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search and suggest existing family member profiles for deduplication',
    description: `**Purpose:** Searches member directory by first name, last name, or bio to prevent duplicate entries and facilitate relative linking.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Member search and deduplication lookup.`,
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search term for member name or details' })
  @ApiResponse({ status: 200, description: 'Matching member profiles returned' })
  searchMembers(@Query('q') query: string) {
    return this.familyService.searchMembers(query || '');
  }

  @Post()
  @ApiOperation({
    summary: 'Add a new family member or link an existing profile with optional platform credentials',
    description: `**Purpose:** Creates a new relative person record, links directional relationships (father, mother, spouse, child, sibling), and optionally provisions platform sign-in accounts.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\` (can add any member anywhere), \`MEMBER\` / \`USER\` (can add relatives connected to their own node).
**Permissions:** Member creation and lineage relative attachment.`,
  })
  @ApiResponse({ status: 201, description: 'Family member created or linked successfully' })
  createMember(
    @Body()
    body: {
      existingPersonId?: string;
      firstName: string;
      lastName: string;
      email?: string;
      password?: string;
      gender?: string;
      bio?: string;
      roleInFamily?: string;
      middleName?: string;
      nickname?: string;
      dob?: string;
      birthplace?: string;
      isDeceased?: boolean;
      dateOfPassing?: string;
      occupation?: string;
      location?: string;
      contactInfo?: string;
      avatarUrl?: string;
      relativeToPersonId?: string;
      relationshipType?: string;
    },
  ) {
    return this.familyService.createMember(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a family member profile',
    description: `**Purpose:** Modifies biographical info, names, or details of a family member.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, or the member updating their own linked profile.
**Permissions:** Edit permission for member profile details.`,
  })
  @ApiParam({ name: 'id', description: 'Unique member / person identifier' })
  @ApiResponse({ status: 200, description: 'Member profile updated successfully' })
  updateMember(
    @Param('id') id: string,
    @Body() body: { firstName?: string; lastName?: string; bio?: string },
  ) {
    return this.familyService.updateMember(id, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a family member from sanctuary',
    description: `**Purpose:** Permanently deletes a family member record, cascading relationship cleanup.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\` strictly.
**Permissions:** High-privilege sanctuary management authority required. Denied for ordinary family members (\`MEMBER\` / \`USER\`).`,
  })
  @ApiParam({ name: 'id', description: 'Unique member / person identifier' })
  @ApiResponse({ status: 200, description: 'Member deleted successfully' })
  deleteMember(@Param('id') id: string) {
    return this.familyService.deleteMember(id);
  }
}
