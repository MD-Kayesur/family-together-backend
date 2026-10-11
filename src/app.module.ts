import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FamilyModule } from './family/family.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [PrismaModule, RedisModule, UsersModule, AuthModule, FamilyModule, BillingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
