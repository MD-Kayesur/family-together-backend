import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function inspect() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, fullName: true, role: true, status: true } });
  const families = await prisma.family.findMany({ select: { id: true, name: true, createdBy: true } });
  const persons = await prisma.person.count();
  const rels = await prisma.relationship.count();
  const mems = await prisma.memory.count();
  const evts = await prisma.event.count();
  const docs = await prisma.document.count();
  const subs = await prisma.subscription.count();
  const invs = await prisma.invitation.count();
  console.log('DB STATUS:', JSON.stringify({
    users,
    families,
    counts: { persons, rels, mems, evts, docs, subs, invs }
  }, null, 2));
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
