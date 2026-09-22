import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Family Events')
@Controller('family/events')
export class EventsController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of upcoming family events, reunions, and milestones',
    description: `**Purpose:** Retrieves chronologically sorted upcoming family celebrations, memorials, birthdays, and virtual/physical gatherings.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read-only access to calendar events.`,
  })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  getEvents() {
    return this.familyService.getEvents();
  }

  @Post()
  @ApiOperation({
    summary: 'Schedule a new family event',
    description: `**Purpose:** Creates and announces a new gathering, event date, virtual meeting link, or physical venue.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\`, \`USER\`
**Permissions:** Any authorized family member can schedule an event.`,
  })
  @ApiResponse({ status: 201, description: 'Event scheduled successfully' })
  createEvent(
    @Body() body: { title: string; date: string; location?: string; isVirtual?: boolean },
  ) {
    return this.familyService.createEvent(body);
  }
}
