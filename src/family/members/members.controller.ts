import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto, MembersQueryDto } from './members.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Family Members')
@Controller('family/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all family members with pagination and search',
    description: `**Purpose:** Retrieves member directory records with pagination, multi-field search (first/last name, bio, occupation, location), and gender/status filtering.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read permission for member directory.`,
  })
  @ApiResponse({ status: 200, description: 'Paginated family members returned' })
  getMembers(@Query() query: MembersQueryDto) {
    return this.membersService.getMembers(query);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search and suggest existing family member profiles for deduplication with pagination',
    description: `**Purpose:** Searches member directory by first name, last name, or bio to prevent duplicate entries and facilitate relative linking.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Member search and deduplication lookup.`,
  })
  @ApiResponse({ status: 200, description: 'Matching member profiles returned' })
  searchMembers(@Query() query: PaginationQueryDto) {
    return this.membersService.searchMembers(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a new family member or link an existing profile with optional platform credentials',
    description: `**Purpose:** Creates a new relative person record, links directional relationships (father, mother, spouse, child, sibling), and optionally provisions platform sign-in accounts.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\` (can add any member anywhere), \`MEMBER\` / \`USER\` (can add relatives connected to their own node).
**Permissions:** Member creation and lineage relative attachment.`,
  })
  @ApiResponse({ status: 201, description: 'Family member created or linked successfully' })
  createMember(@Body() body: CreateMemberDto) {
    return this.membersService.createMember(body);
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
    @Body() body: UpdateMemberDto,
  ) {
    return this.membersService.updateMember(id, body);
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
    return this.membersService.deleteMember(id);
  }
}
