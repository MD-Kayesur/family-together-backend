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

// Services
import { FamilyService } from './family.service';
import { MembersService } from './members/members.service';
import { RelationshipsService } from './relationships/relationships.service';
import { MemoriesService } from './memories/memories.service';
import { EventsService } from './events/events.service';
import { DocumentsService } from './documents/documents.service';
import { InvitationsService } from './invitations/invitations.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [
    FamilyController,
    MembersController,
    RelationshipsController,
    MemoriesController,
    EventsController,
    DocumentsController,
    InvitationsController,
  ],
  providers: [
    FamilyService,
    MembersService,
    RelationshipsService,
    MemoriesService,
    EventsService,
    DocumentsService,
    InvitationsService,
  ],
  exports: [
    FamilyService,
    MembersService,
    RelationshipsService,
    MemoriesService,
    EventsService,
    DocumentsService,
    InvitationsService,
  ],
})
export class FamilyModule {}
