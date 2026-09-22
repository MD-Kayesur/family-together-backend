import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FamilyService } from './family.service';

@ApiTags('Family Sanctuary')
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get('sanctuary')
  @ApiOperation({
    summary: 'Get main family sanctuary overview and dashboard statistics',
    description: `**Purpose:** Retrieves core family metadata, total member counts, connected user metrics, total memories, and active relationships.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\`, \`USER\`
**Permissions:** Read-only access to sanctuary dashboard data.`,
  })
  @ApiResponse({ status: 200, description: 'Family sanctuary data retrieved successfully' })
  getSanctuaryData() {
    return this.familyService.getSanctuaryData();
  }

  @Patch('update')
  @ApiOperation({
    summary: 'Update main family sanctuary profile details',
    description: `**Purpose:** Updates the primary name and biographical description of the family tree sanctuary.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Sanctuary management authority required (denied for ordinary \`MEMBER\` / \`VIEWER\`).`,
  })
  @ApiResponse({ status: 200, description: 'Sanctuary details updated successfully' })
  updateFamily(@Body() body: { name?: string; description?: string }) {
    return this.familyService.updateFamilyDetails(body);
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Get recent sanctuary audit activity logs',
    description: `**Purpose:** Streams timestamped event logs of recent member creations, memory additions, relationship updates, and document uploads.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`, \`MEMBER\`, \`USER\`
**Permissions:** Read-only access to family audit activity logs.`,
  })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully' })
  getActivityLogs() {
    return this.familyService.getActivityLogs();
  }

  @Patch('settings')
  @ApiOperation({
    summary: 'Update family sanctuary settings and preferences',
    description: `**Purpose:** Configures global privacy levels, notification preferences, and sanctuary configuration options.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Sanctuary administrative authority required.`,
  })
  @ApiResponse({ status: 200, description: 'Sanctuary settings updated successfully' })
  updateSanctuarySettings(
    @Body() body: { name?: string; description?: string },
  ) {
    return this.familyService.updateSanctuarySettings(body);
  }

  @Get('admin/stats')
  @ApiOperation({
    summary: 'Get administrative network metrics and stats',
    description: `**Purpose:** Returns system-level multi-tenant platform metrics, total registered accounts, storage usage, and operational health.
**Allowed Roles:** \`ADMIN\`, \`SUPER_ADMIN\`
**Permissions:** Platform administration privileges required (denied for \`OWNER\`, \`MEMBER\`, \`USER\`).`,
  })
  @ApiResponse({ status: 200, description: 'Admin statistics retrieved successfully' })
  getAdminStats() {
    return this.familyService.getAdminStats();
  }
}


