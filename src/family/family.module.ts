import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

// Controllers
import { FamilyController } from './family.controller';
import { MembersController } from './members/members.controller';
import { RelationshipsController } from './relationships/relationships.controller';
import { MemoriesController } from './memories/memories.controller';
import { EventsController } from './events/events.controller';
import { DocumentsController } from './documents/documents.controller';
import { InvitationsController } from './invitations/invitations.controller';
import { AnnouncementsController } from './announcements/announcements.controller';
import { GedcomController } from './gedcom/gedcom.controller';

// Services
import { FamilyService } from './family.service';
import { MembersService } from './members/members.service';
import { RelationshipsService } from './relationships/relationships.service';
import { MemoriesService } from './memories/memories.service';
import { EventsService } from './events/events.service';
import { DocumentsService } from './documents/documents.service';
import { InvitationsService } from './invitations/invitations.service';
import { AnnouncementsService } from './announcements/announcements.service';
import { GedcomService } from './gedcom/gedcom.service';

import { ChatModule } from './chat/chat.module';

@Module({
  imports: [PrismaModule, MailModule, ChatModule],
  controllers: [
    FamilyController,
    MembersController,
    RelationshipsController,
    MemoriesController,
    EventsController,
    DocumentsController,
    InvitationsController,
    AnnouncementsController,
    GedcomController,
  ],
  providers: [
    FamilyService,
    MembersService,
    RelationshipsService,
    MemoriesService,
    EventsService,
    DocumentsService,
    InvitationsService,
    AnnouncementsService,
    GedcomService,
  ],
  exports: [
    FamilyService,
    MembersService,
    RelationshipsService,
    MemoriesService,
    EventsService,
    DocumentsService,
    InvitationsService,
    AnnouncementsService,
    GedcomService,
    ChatModule,
  ],
})
export class FamilyModule {}
