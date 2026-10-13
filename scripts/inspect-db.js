require('dotenv').config();
const { PrismaClient } = require('../dist/generated/prisma/client.js');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, status: true }
  });
  const families = await prisma.family.findMany({
    include: {
      members: { include: { person: true } },
      subscription: true
    }
  });
  const persons = await prisma.person.findMany({
    select: { id: true, firstName: true, lastName: true, gender: true, isAlive: true, userId: true }
  });
  const relTypes = await prisma.relationshipType.findMany();
  const rels = await prisma.relationship.findMany({
    include: { fromPerson: true, toPerson: true, relationshipType: true }
  });
  const memories = await prisma.memory.findMany();
  const events = await prisma.event.findMany();
  const docs = await prisma.document.findMany();
  const invs = await prisma.invitation.findMany();

  console.log(JSON.stringify({
    usersCount: users.length,
    users: users.slice(0, 10),
    familiesCount: families.length,
    families: families.map(f => ({ id: f.id, name: f.name, membersCount: f.members.length, hasSub: !!f.subscription })),
    personsCount: persons.length,
    persons: persons.slice(0, 10),
    relTypesCount: relTypes.length,
    relTypes: relTypes.map(rt => ({ code: rt.code, name: rt.name })),
    relsCount: rels.length,
    memoriesCount: memories.length,
    eventsCount: events.length,
    docsCount: docs.length,
    invsCount: invs.length
  }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
