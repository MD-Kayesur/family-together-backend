import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'm747p4hujb@tanpony.com';
  const user = await prisma.user.findUnique({ where: { email } });
  console.log(`User query for '${email}':`, user ? `Found (ID: ${user.id}, Role: ${user.role})` : 'NOT FOUND IN DATABASE');
}

main().finally(() => prisma.$disconnect());
