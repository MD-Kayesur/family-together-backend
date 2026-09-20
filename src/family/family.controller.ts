import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Family Sanctuary')
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get('sanctuary')
  @ApiOperation({ summary: 'Get main family sanctuary data and dashboard statistics' })
  getSanctuaryData() {
    return this.familyService.getSanctuaryData();
  }

  @Patch('update')
  @ApiOperation({ summary: 'Update main family sanctuary details' })
  updateFamily(@Body() body: { name?: string; description?: string }) {
    return this.familyService.updateFamilyDetails(body);
  }

  @Get('members')
  @ApiOperation({ summary: 'Get all family members' })
  getMembers() {
    return this.familyService.getMembers();
  }

  @Get('members/search')
  @ApiOperation({ summary: 'Search and suggest existing family member profiles for deduplication' })
  searchMembers(@Query('q') query: string) {
    return this.familyService.searchMembers(query || '');
  }

  @Post('members')
  @ApiOperation({ summary: 'Add a new family member or link an existing profile with optional platform login' })
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
    },
  ) {
    return this.familyService.createMember(body);
  }

  @Patch('members/:id')
  @ApiOperation({ summary: 'Update a family member' })
  updateMember(
    @Param('id') id: string,
    @Body() body: { firstName?: string; lastName?: string; bio?: string }
  ) {
    return this.familyService.updateMember(id, body);
  }

  @Delete('members/:id')
  @ApiOperation({ summary: 'Delete a family member' })
  deleteMember(@Param('id') id: string) {
    return this.familyService.deleteMember(id);
  }

  @Get('memories')
  @ApiOperation({ summary: 'Get family memories gallery' })
  getMemories() {
    return this.familyService.getMemories();
  }

  @Post('memories')
  @ApiOperation({ summary: 'Add a new family memory' })
  createMemory(
    @Body()
    body: {
      title: string;
      description?: string;
      sharedBy?: string;
      date?: string;
      location?: string;
      category?: string;
      mediaUrl?: string;
      taggedMembers?: string;
      privacy?: string;
    },
  ) {
    return this.familyService.createMemory(body);
  }

  @Get('memories/:id')
  @ApiOperation({ summary: 'Get a single family memory by ID' })
  getMemoryById(@Param('id') id: string) {
    return this.familyService.getMemoryById(id);
  }

  @Patch('memories/:id')
  @ApiOperation({ summary: 'Update an existing family memory' })
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
      taggedMembers?: string;
      privacy?: string;
    },
  ) {
    return this.familyService.updateMemory(id, body);
  }

  @Delete('memories/:id')
  @ApiOperation({ summary: 'Delete a family memory' })
  deleteMemory(@Param('id') id: string) {
    return this.familyService.deleteMemory(id);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get family upcoming events' })
  getEvents() {
    return this.familyService.getEvents();
  }

  @Post('events')
  @ApiOperation({ summary: 'Add a new family event' })
  createEvent(
    @Body() body: { title: string; date: string; location?: string; isVirtual?: boolean }
  ) {
    return this.familyService.createEvent(body);
  }

  @Get('relationships')
  @ApiOperation({ summary: 'Get family relationships matrix' })
  getRelationships() {
    return this.familyService.getRelationships();
  }

  @Post('relationships')
  @ApiOperation({ summary: 'Create a relationship link between relatives' })
  createRelationship(
    @Body() body: { fromPersonId: string; toPersonId: string; typeCode?: string }
  ) {
    return this.familyService.createRelationship(body);
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get encrypted family documents vault' })
  getDocuments() {
    return this.familyService.getDocuments();
  }

  @Post('documents')
  @ApiOperation({ summary: 'Upload a document to family vault' })
  createDocument(
    @Body() body: { name: string; category?: string; size?: string; uploadedBy?: string }
  ) {
    return this.familyService.createDocument(body);
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete a document from vault' })
  deleteDocument(@Param('id') id: string) {
    return this.familyService.deleteDocument(id);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'Get pending join requests and invitations' })
  getInvitations() {
    return this.familyService.getInvitations();
  }

  @Post('invitations')
  @ApiOperation({ summary: 'Send a new invitation request' })
  createInvitation(
    @Body() body: { name: string; email: string; role?: string; note?: string }
  ) {
    return this.familyService.createInvitation(body);
  }

  @Patch('invitations/:id')
  @ApiOperation({ summary: 'Approve or reject join request invitation' })
  updateInvitationStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    return this.familyService.updateInvitationStatus(id, body.status);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent sanctuary activity logs' })
  getActivityLogs() {
    return this.familyService.getActivityLogs();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update family sanctuary settings' })
  updateSanctuarySettings(
    @Body() body: { name?: string; description?: string }
  ) {
    return this.familyService.updateSanctuarySettings(body);
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Get administrative network metrics and stats' })
  getAdminStats() {
    return this.familyService.getAdminStats();
  }
}

