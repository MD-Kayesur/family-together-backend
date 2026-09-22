import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Family Events')
@Controller('family/events')
export class EventsController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of upcoming family events, reunions, and milestones' })
  getEvents() {
    return this.familyService.getEvents();
  }

  @Post()
  @ApiOperation({ summary: 'Schedule a new family event' })
  createEvent(
    @Body() body: { title: string; date: string; location?: string; isVirtual?: boolean },
  ) {
    return this.familyService.createEvent(body);
  }
}
