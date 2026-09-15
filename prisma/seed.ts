import 'dotenv/config';
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_OijKbCaX0Im1@ep-tiny-bar-az5kqldq-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding FamilyRoots PostgreSQL Database...");

  // 1. Create or Find Main Owner User
  let ownerUser = await prisma.user.findUnique({
    where: { email: "owner@familyroots.io" },
  });

  if (!ownerUser) {
    ownerUser = await prisma.user.create({
      data: {
        email: "owner@familyroots.io",
        fullName: "Tariq Rahman",
        role: "OWNER",
        status: "ACTIVE",
        emailVerified: true,
      },
    });
  }

  // 2. Create Main Family Sanctuary
  let family = await prisma.family.findFirst({
    where: { createdBy: ownerUser.id },
  });

  if (!family) {
    family = await prisma.family.create({
      data: {
        name: "The Rahman Family",
        description:
          "Established in roots of resilience and growth. The Rahman family sanctuary is dedicated to preserving our shared history, celebrating current milestones, and connecting generations across the globe.",
        createdBy: ownerUser.id,
      },
    });
  }

  // 3. Create Key Persons in Database
  const omarPerson = await prisma.person.create({
    data: {
      firstName: "Omar",
      lastName: "Rahman",
      gender: "MALE",
      isAlive: true,
      bio: "Patriarch of the Rahman family",
    },
  });

  const tariqPerson = await prisma.person.create({
    data: {
      userId: ownerUser.id,
      firstName: "Tariq",
      lastName: "Rahman",
      gender: "MALE",
      email: ownerUser.email,
      isAlive: true,
      bio: "Sanctuary Owner & Administrator",
    },
  });

  const aishaPerson = await prisma.person.create({
    data: {
      firstName: "Aisha",
      lastName: "Rahman",
      gender: "FEMALE",
      isAlive: true,
      bio: "Sister & Archivist",
    },
  });

  const farahPerson = await prisma.person.create({
    data: {
      firstName: "Farah",
      lastName: "N.",
      gender: "FEMALE",
      isAlive: true,
      bio: "Cousin & Event Organizer",
    },
  });

  const fatimaPerson = await prisma.person.create({
    data: {
      firstName: "Fatima",
      lastName: "Rahman",
      gender: "FEMALE",
      isAlive: true,
      bio: "Family Matriarch",
    },
  });

  // 4. Create Family Memberships
  await prisma.familyMember.createMany({
    data: [
      { familyId: family.id, personId: omarPerson.id, role: "ADMIN" },
      { familyId: family.id, personId: tariqPerson.id, role: "OWNER" },
      { familyId: family.id, personId: aishaPerson.id, role: "MEMBER" },
      { familyId: family.id, personId: farahPerson.id, role: "MEMBER" },
      { familyId: family.id, personId: fatimaPerson.id, role: "ADMIN" },
    ],
    skipDuplicates: true,
  });

  // 5. Create Sample Memories in Database
  await prisma.memory.create({
    data: {
      familyId: family.id,
      title: "Eid al-Fitr Gathering 2023",
      description:
        "Shared by Amina Rahman • A wonderful weekend celebrating with extended family from overseas.",
      photoCount: 12,
      sharedBy: "Amina Rahman",
    },
  });

  // 6. Create Sample Events in Database
  await prisma.event.createMany({
    data: [
      {
        familyId: family.id,
        title: "Grandpa's 80th Birthday",
        date: new Date("2026-08-14"),
        location: "Dhaka, Bangladesh",
        isVirtual: false,
      },
      {
        familyId: family.id,
        title: "Annual Family Reunion",
        date: new Date("2026-09-02"),
        location: "Virtual Link",
        isVirtual: true,
      },
    ],
    skipDuplicates: true,
  });

  // 7. Create Sample Documents
  await prisma.document.createMany({
    data: [
      {
        familyId: family.id,
        name: "Rahman_Family_Heritage_Will_1954.pdf",
        category: "Legal Records",
        size: "4.2 MB",
        uploadedBy: "Tariq Rahman",
      },
      {
        familyId: family.id,
        name: "Grandpa_Birth_Certificate_Scanned.pdf",
        category: "Vital Records",
        size: "1.8 MB",
        uploadedBy: "Aisha Rahman",
      },
      {
        familyId: family.id,
        name: "Immigration_Passports_Archive.pdf",
        category: "Immigration",
        size: "12.5 MB",
        uploadedBy: "Omar Rahman",
      },
    ],
    skipDuplicates: true,
  });

  // 8. Create Sample Invitations
  await prisma.invitation.createMany({
    data: [
      {
        familyId: family.id,
        name: "Zain Rahman",
        email: "zain@gmail.com",
        role: "MEMBER",
        status: "PENDING",
        note: "Claims to be cousin from Canada",
      },
      {
        familyId: family.id,
        name: "Samiha Rahman",
        email: "samiha@gmail.com",
        role: "VIEWER",
        status: "PENDING",
        note: "Requested view access to family photos",
      },
    ],
    skipDuplicates: true,
  });

  // 9. Create Sample Relationship Types & Relationships
  let relType = await prisma.relationshipType.findFirst({
    where: { code: "PARENT_CHILD" },
  });

  if (!relType) {
    relType = await prisma.relationshipType.create({
      data: {
        code: "PARENT_CHILD",
        name: "Parent - Child",
        category: "BIOLOGICAL",
      },
    });
  }

  await prisma.relationship.createMany({
    data: [
      {
        familyId: family.id,
        fromPersonId: omarPerson.id,
        toPersonId: tariqPerson.id,
        relationshipTypeId: relType.id,
        createdBy: ownerUser.id,
      },
      {
        familyId: family.id,
        fromPersonId: fatimaPerson.id,
        toPersonId: tariqPerson.id,
        relationshipTypeId: relType.id,
        createdBy: ownerUser.id,
      },
      {
        familyId: family.id,
        fromPersonId: tariqPerson.id,
        toPersonId: aishaPerson.id,
        relationshipTypeId: relType.id,
        createdBy: ownerUser.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ PostgreSQL Database Seeding Complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
