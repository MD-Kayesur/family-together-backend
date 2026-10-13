import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { BroadcastEmailDto, AnnouncementsQueryDto } from './announcements.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../../generated/prisma/client';

@ApiTags('Sanctuary Announcements & Email Broadcast')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
@Controller('family/announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Broadcast message to all family member Gmail inboxes [Roles: OWNER, ADMIN]',
    description: `**Route:** \`POST /family/announcements/broadcast\`
**Purpose:** Dispatches an announcement email to all active, living family members. Direct replies from members' email apps are automatically routed to the Owner's personal email address via RFC 5322 Reply-To standard.
**Allowed Roles:** \`OWNER\`, \`ADMIN\`, \`SUPER_ADMIN\``,
  })
  @ApiResponse({ status: 201, description: 'Announcement broadcasted successfully' })
  async broadcast(@Req() req: any, @Body() dto: BroadcastEmailDto) {
    const userId = req.user?.id || req.user?.userId;
    return this.announcementsService.broadcastAnnouncement(userId, dto);
  }

  @Get('recipients')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Preview eligible recipient count and directory before broadcasting [Roles: OWNER, ADMIN]',
  })
  async getRecipients(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    return this.announcementsService.getRecipientsPreview(userId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get historical broadcast announcements log [Roles: OWNER, ADMIN, MEMBER]',
    description: 'Retrieves timestamped history of previous broadcasts including delivery count, subject, and snippet.',
  })
  async getHistory(@Req() req: any, @Query() query: AnnouncementsQueryDto) {
    const userId = req.user?.id || req.user?.userId;
    return this.announcementsService.getAnnouncementHistory(userId, query);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete broadcast record from history [Roles: OWNER, ADMIN]',
  })
  async deleteItem(@Param('id') id: string) {
    return this.announcementsService.deleteAnnouncement(id);
  }
}
