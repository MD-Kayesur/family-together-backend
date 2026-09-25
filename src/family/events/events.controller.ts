import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto, EventsQueryDto } from './events.dto';

@ApiTags('Family Events')
@Controller('family/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get upcoming family events and reunions with pagination, status filter, and search [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`GET /family/events\`
**Purpose:** Retrieves upcoming family celebrations, memorials, birthdays, and reunions with page, limit pagination, status filter (ACTIVE for upcoming/today vs INACTIVE for expired/past), virtual filter, and multi-field search (title, description, location).
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read-only access to calendar events.`,
  })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully with pagination metadata' })
  getEvents(@Query() query: EventsQueryDto) {
    return this.eventsService.getEvents(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get single family event details by ID [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`GET /family/events/:id\`
**Purpose:** Retrieves complete record and agenda for an individual family celebration or gathering by its unique identifier.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Read permission for authorized family members.`,
  })
  @ApiParam({ name: 'id', description: 'Unique event identifier' })
  @ApiResponse({ status: 200, description: 'Event details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getEventById(@Param('id') id: string) {
    return this.eventsService.getEventById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Schedule a new family event [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`POST /family/events\`
**Purpose:** Creates and announces a new gathering, event date, virtual meeting link, or physical venue.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\`, \`USER\`
**Permissions:** Any authorized family member can schedule an event.`,
  })
  @ApiResponse({ status: 201, description: 'Event scheduled successfully' })
  createEvent(@Body() body: CreateEventDto) {
    return this.eventsService.createEvent(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing family event by ID [Roles: MEMBER, OWNER, ADMIN]',
    description: `**Route:** \`PATCH /family/events/:id\`
**Purpose:** Modifies event title, date, location, virtual flag, or description agenda details.
**Allowed Roles:** \`MEMBER\`, \`USER\`, \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Authorized family members and sanctuary owners can update event details.`,
  })
  @ApiParam({ name: 'id', description: 'Unique event identifier' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  updateEvent(
    @Param('id') id: string,
    @Body() body: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(id, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a family event by ID [Roles: OWNER, ADMIN]',
    description: `**Route:** \`DELETE /family/events/:id\`
**Purpose:** Permanently cancels and removes a family event from the calendar.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Sanctuary management authority required to delete calendar events (denied for ordinary \`MEMBER\`).`,
  })
  @ApiParam({ name: 'id', description: 'Unique event identifier' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  deleteEvent(@Param('id') id: string) {
    return this.eventsService.deleteEvent(id);
  }
}
