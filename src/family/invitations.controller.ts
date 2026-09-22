import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Family Invitations')
@Controller('family/invitations')
export class InvitationsController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of pending member invitations and requests' })
  getInvitations() {
    return this.familyService.getInvitations();
  }

  @Post()
  @ApiOperation({ summary: 'Send a new family member invitation request' })
  createInvitation(
    @Body() body: { name: string; email: string; role?: string; note?: string },
  ) {
    return this.familyService.createInvitation(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Approve or reject join request invitation' })
  @ApiParam({ name: 'id', description: 'Unique invitation identifier' })
  updateInvitationStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.familyService.updateInvitationStatus(id, body.status);
  }
}
