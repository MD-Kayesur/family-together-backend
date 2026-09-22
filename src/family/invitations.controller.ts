import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { FamilyService } from './family.service';
import { InvitationsQueryDto } from './dto/family-query.dto';

@ApiTags('Family Invitations')
@Controller('family/invitations')
export class InvitationsController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of pending member invitations and requests with pagination and search',
    description: `**Purpose:** Retrieves pending, approved, and declined invitations and join requests for the sanctuary with pagination, keyword search, and status filtering.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Sanctuary management authority required to view pending invitation lists.`,
  })
  @ApiResponse({ status: 200, description: 'List of invitations retrieved successfully' })
  getInvitations(@Query() query: InvitationsQueryDto) {
    return this.familyService.getInvitations(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Send a new family member invitation request',
    description: `**Purpose:** Dispatches an email invitation containing a unique join token to welcome new relatives into the family sanctuary tree.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\`, \`USER\`
**Permissions:** Any verified family member or owner can invite new relatives to join.`,
  })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully' })
  createInvitation(
    @Body() body: { name: string; email: string; role?: string; note?: string },
  ) {
    return this.familyService.createInvitation(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Approve or reject join request invitation',
    description: `**Purpose:** Approves a relative's request to join the sanctuary tree or rejects/revokes an expired invitation.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Sanctuary owner or administrator approval required (denied for ordinary \`MEMBER\`).`,
  })
  @ApiParam({ name: 'id', description: 'Unique invitation identifier' })
  @ApiResponse({ status: 200, description: 'Invitation status updated successfully' })
  updateInvitationStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.familyService.updateInvitationStatus(id, body.status);
  }
}
