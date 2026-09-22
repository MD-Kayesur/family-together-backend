import { Controller, Get, Patch, Body } from '@nestjs/common';
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

  @Get('activity')
  @ApiOperation({ summary: 'Get recent sanctuary audit activity logs' })
  getActivityLogs() {
    return this.familyService.getActivityLogs();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update family sanctuary settings' })
  updateSanctuarySettings(
    @Body() body: { name?: string; description?: string },
  ) {
    return this.familyService.updateSanctuarySettings(body);
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Get administrative network metrics and stats' })
  getAdminStats() {
    return this.familyService.getAdminStats();
  }
}


