import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { PushService } from './push.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'family-roots-jwt-secret-key-2026',
      signOptions: { expiresIn: (process.env.JWT_EXPIRATION as any) || '15m' },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, PushService],
  exports: [ChatService, ChatGateway, PushService],
})
export class ChatModule {}
