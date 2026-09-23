import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto, UpdateInvitationStatusDto, InvitationsQueryDto } from './invitations.dto';

@ApiTags('Family Invitations')
@Controller('family/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of pending member invitations and requests with pagination and search [Roles: OWNER, ADMIN]',
    description: `**Route:** \`GET /family/invitations\`
**Purpose:** Retrieves pending, approved, and declined invitations and join requests for the sanctuary with pagination, keyword search, and status filtering.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Sanctuary management authority required to view pending invitation lists.`,
  })
  @ApiResponse({ status: 200, description: 'List of invitations retrieved successfully' })
  getInvitations(@Query() query: InvitationsQueryDto) {
    return this.invitationsService.getInvitations(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Send a new family member invitation request [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`POST /family/invitations\`
**Purpose:** Dispatches an email invitation containing a unique join token to welcome new relatives into the family sanctuary tree.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\`, \`USER\`
**Permissions:** Any verified family member or owner can invite new relatives to join.`,
  })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully' })
  createInvitation(@Body() body: CreateInvitationDto) {
    return this.invitationsService.createInvitation(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Approve or reject join request invitation [Roles: OWNER, ADMIN]',
    description: `**Route:** \`PATCH /family/invitations/:id\`
**Purpose:** Approves a relative's request to join the sanctuary tree or rejects/revokes an expired invitation.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Sanctuary owner or administrator approval required (denied for ordinary \`MEMBER\`).`,
  })
  @ApiParam({ name: 'id', description: 'Unique invitation identifier' })
  @ApiResponse({ status: 200, description: 'Invitation status updated successfully' })
  updateInvitationStatus(
    @Param('id') id: string,
    @Body() body: UpdateInvitationStatusDto,
  ) {
    return this.invitationsService.updateInvitationStatus(id, body.status);
  }
}
