import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../../mail/mail.module';
import { AuthModule } from '../../auth/auth.module';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  imports: [PrismaModule, MailModule, AuthModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
