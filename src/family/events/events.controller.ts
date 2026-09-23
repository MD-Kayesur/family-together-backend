import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, EventsQueryDto } from './events.dto';

@ApiTags('Family Events')
@Controller('family/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of upcoming family events, reunions, and milestones with pagination and search',
    description: `**Purpose:** Retrieves upcoming family celebrations, memorials, birthdays, and virtual/physical gatherings with pagination and keyword search.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read-only access to calendar events.`,
  })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  getEvents(@Query() query: EventsQueryDto) {
    return this.eventsService.getEvents(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Schedule a new family event',
    description: `**Purpose:** Creates and announces a new gathering, event date, virtual meeting link, or physical venue.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\`, \`USER\`
**Permissions:** Any authorized family member can schedule an event.`,
  })
  @ApiResponse({ status: 201, description: 'Event scheduled successfully' })
  createEvent(@Body() body: CreateEventDto) {
    return this.eventsService.createEvent(body);
  }
}
