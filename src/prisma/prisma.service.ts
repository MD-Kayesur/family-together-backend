import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_OijKbCaX0Im1@ep-tiny-bar-az5kqldq-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }


  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully!');
      console.log('Database connected');
    } catch (error) {
      this.logger.error('Failed to connect to the database:', error);
      console.error('Database connection failed:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}


