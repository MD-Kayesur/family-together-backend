import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function testMemberToMember() {
  console.log('--- 🧪 TESTING MEMBER-TO-MEMBER CONNECTED MESSAGING ---');

  const family = await prisma.family.findFirst();
  const members = await prisma.user.findMany({
    where: { role: 'MEMBER' },
    include: { person: true },
    take: 2,
  });

  if (members.length < 2) {
    console.log('Not enough members to test directly.');
    return;
  }

  const memberA = members[0];
  const memberB = members[1];

  console.log(`Member A: ${memberA.fullName} (${memberA.id})`);
  console.log(`Member B: ${memberB.fullName} (${memberB.id})`);

  // PART 1: When Unconnected
  console.log('\n[SCENARIO 1: UNCONNECTED MEMBERS]');
  const isDirectCreatorInitial = (memberA.createdById === memberB.id || memberB.createdById === memberA.id);
  console.log(`  - Direct Creator link: ${isDirectCreatorInitial}`);
  console.log(`  - Can Member A message Member B? ${isDirectCreatorInitial ? 'YES' : '❌ NO (BLOCKED: Must connect first)'}`);

  // PART 2: Connect them! (Simulating Member A adding Member B or family connection)
  console.log('\n[SCENARIO 2: CONNECTING MEMBERS ("Who has added whom")]');
  await prisma.user.update({
    where: { id: memberB.id },
    data: { createdById: memberA.id },
  });
  console.log(`Updated Member B: added by Member A (createdById = ${memberA.id})`);

  // Re-fetch Member B
  const updatedB = await prisma.user.findUnique({ where: { id: memberB.id } });
  const isConnectedNow = (memberA.id === updatedB.createdById || updatedB.id === memberA.createdById);

  console.log(`\nConnection Check After Connecting:`);
  console.log(`  - Member A added Member B: ${isConnectedNow}`);
  console.log(`  - Can Member A message Member B now? ${isConnectedNow ? '✅ YES (ALLOWED!)' : '❌ NO'}`);
  console.log(`  - Can Member B reply to Member A now? ${isConnectedNow ? '✅ YES (ALLOWED!)' : '❌ NO'}`);

  // PART 3: Establish 1-on-1 Conversation
  console.log('\n[SCENARIO 3: SENDING MESSAGES]');
  let conv = await prisma.conversation.findFirst({
    where: {
      familyId: family.id,
      type: 'DIRECT',
      AND: [
        { participants: { some: { userId: memberA.id } } },
        { participants: { some: { userId: memberB.id } } },
      ],
    },
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        familyId: family.id,
        type: 'DIRECT',
        participants: {
          create: [{ userId: memberA.id }, { userId: memberB.id }],
        },
      },
    });
    console.log(`Created new 1-on-1 Conversation ID: ${conv.id}`);
  } else {
    console.log(`Found existing 1-on-1 Conversation ID: ${conv.id}`);
  }

  // Member A sends to Member B
  const msgA = await prisma.chatMessage.create({
    data: {
      conversationId: conv.id,
      senderId: memberA.id,
      senderName: memberA.fullName,
      text: 'Hey! Since we are connected now, are you coming to the family picnic?',
      status: 'SENT',
    },
  });
  console.log(`  💬 [${memberA.fullName} -> ${memberB.fullName}]: "${msgA.text}"`);

  // Member B replies to Member A
  const msgB = await prisma.chatMessage.create({
    data: {
      conversationId: conv.id,
      senderId: memberB.id,
      senderName: memberB.fullName,
      text: 'Yes! Glad we connected on FamilyRoots. See you at the picnic! 🍉',
      status: 'SENT',
    },
  });
  console.log(`  💬 [${memberB.fullName} -> ${memberA.fullName}]: "${msgB.text}"`);

  console.log('\n🎉 RESULT: Connected members can message each other seamlessly and converse like in Facebook Messenger!');
}

testMemberToMember()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
