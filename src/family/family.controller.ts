import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
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

  @Get('members')
  @ApiOperation({ summary: 'Get all family members' })
  getMembers() {
    return this.familyService.getMembers();
  }

  @Post('members')
  @ApiOperation({ summary: 'Add a new family member' })
  createMember(
    @Body() body: { firstName: string; lastName: string; gender?: string; bio?: string; roleInFamily?: string }
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
  createMemory(@Body() body: { title: string; description?: string; sharedBy?: string }) {
    return this.familyService.createMemory(body);
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
}
