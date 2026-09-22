import { Module } from '@nestjs/common';
import { FamilyController } from './family.controller';
import { MembersController } from './members.controller';
import { RelationshipsController } from './relationships.controller';
import { MemoriesController } from './memories.controller';
import { EventsController } from './events.controller';
import { DocumentsController } from './documents.controller';
import { InvitationsController } from './invitations.controller';
import { FamilyService } from './family.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

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
  providers: [FamilyService],
  exports: [FamilyService],
})
export class FamilyModule {}

