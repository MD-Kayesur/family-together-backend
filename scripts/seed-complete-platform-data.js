require('dotenv').config();
const { PrismaClient } = require('../dist/generated/prisma/client.js');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('🚀 Starting Comprehensive Platform Seeding for FamilyRoots...');

  const passwordHash = bcrypt.hashSync('Family@123', 10);
  const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);

  // ==========================================
  // 1. SEED / UPSERT CORE USERS ACROSS ROLES
  // ==========================================
  console.log('👤 Seeding Platform Users...');

  const usersData = [
    {
      email: 'owner@familyroots.io',
      fullName: 'Tariq Rahman',
      role: 'OWNER',
      status: 'ACTIVE',
      password: passwordHash,
      phoneNumber: '+1 (555) 234-5678',
      bio: 'Sanctuary Founder, Software Architect & Lineage Guardian.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      emailVerified: true,
      emailVerifiedAt: new Date('2026-01-01'),
    },
    {
      email: 'admin@familyroots.io',
      fullName: 'Dr. Amina Rahman',
      role: 'ADMIN',
      status: 'ACTIVE',
      password: adminPasswordHash,
      phoneNumber: '+1 (555) 876-5432',
      bio: 'Platform Administrator, Pediatric Cardiologist & Family Historian.',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      emailVerified: true,
      emailVerifiedAt: new Date('2026-01-01'),
    },
    {
      email: 'member@familyroots.io',
      fullName: 'Zayd Rahman',
      role: 'MEMBER',
      status: 'ACTIVE',
      password: passwordHash,
      phoneNumber: '+1 (555) 345-6789',
      bio: 'Active Family Member, CS Student at NYU & Digital Archivist.',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      emailVerified: true,
      emailVerifiedAt: new Date('2026-02-15'),
    },
    {
      email: 'viewer@familyroots.io',
      fullName: 'Samiha Rahman',
      role: 'VIEWER',
      status: 'ACTIVE',
      password: passwordHash,
      phoneNumber: '+44 20 7946 0912',
      bio: 'Sanctuary Observer, Psychology Major & Heritage Enthusiast.',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      emailVerified: true,
      emailVerifiedAt: new Date('2026-03-01'),
    },
    {
      email: 'superadmin@gmail.com',
      fullName: 'Jane Doe',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      password: adminPasswordHash,
      phoneNumber: '+1 (555) 999-0000',
      bio: 'Master Root Platform Administrator.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      emailVerified: true,
      emailVerifiedAt: new Date('2026-01-01'),
    },
    {
      email: 'rmdkayesur@gmail.com',
      fullName: 'MD kayesur Rahman',
      role: 'ADMIN',
      status: 'ACTIVE',
      password: passwordHash,
      phoneNumber: '+880 1712 345678',
      bio: 'Full-Stack Software Engineer & Lead Sanctuary Developer.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      emailVerified: true,
      emailVerifiedAt: new Date('2026-01-01'),
    },
  ];

  const seededUsers = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        role: u.role,
        status: u.status,
        phoneNumber: u.phoneNumber,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        password: u.password,
        emailVerified: u.emailVerified,
      },
      create: u,
    });
    seededUsers[u.email] = user;
    console.log(`  ✓ User [${user.role}] ${user.email} (${user.id})`);
  }

  const ownerUser = seededUsers['owner@familyroots.io'];

  // ==========================================
  // 2. SEED / UPDATE PRIMARY FAMILY SANCTUARY
  // ==========================================
  console.log('\n🏛️ Setting up Primary Family Sanctuary...');

  let primaryFamily = await prisma.family.findFirst({
    where: {
      OR: [
        { createdBy: ownerUser.id },
        { name: { contains: 'Rahman', mode: 'insensitive' } },
      ],
    },
  });

  if (!primaryFamily) {
    primaryFamily = await prisma.family.create({
      data: {
        name: 'The Rahman Ancestral Sanctuary',
        description:
          'Established in roots of resilience, unity, and growth. Dedicated to preserving our multi-generational heritage, oral traditions, and archival memories across generations worldwide.',
        avatarUrl:
          'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
        createdBy: ownerUser.id,
      },
    });
  } else {
    primaryFamily = await prisma.family.update({
      where: { id: primaryFamily.id },
      data: {
        name: 'The Rahman Ancestral Sanctuary',
        description:
          'Established in roots of resilience, unity, and growth. Dedicated to preserving our multi-generational heritage, oral traditions, and archival memories across generations worldwide.',
        avatarUrl:
          'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
        createdBy: ownerUser.id,
      },
    });
  }
  console.log(`  ✓ Sanctuary: "${primaryFamily.name}" (${primaryFamily.id})`);

  // ==========================================
  // 3. SEED RELATIONSHIP TYPES
  // ==========================================
  console.log('\n🔗 Seeding Relationship Types...');

  const relationshipTypesData = [
    { code: 'PARENT_CHILD', name: 'Parent - Child', category: 'BIOLOGICAL', description: 'Biological or adoptive parent to child relationship' },
    { code: 'Parent ➔ Child', name: 'Parent - Child', category: 'BIOLOGICAL', description: 'Visual UI tree display variant' },
    { code: 'SPOUSE', name: 'Spouse / Partner', category: 'MARITAL', description: 'Legal marital or committed life partnership' },
    { code: 'Spouse / Married', name: 'Spouse / Partner', category: 'MARITAL', description: 'Visual UI tree display variant' },
    { code: 'SIBLING', name: 'Sibling', category: 'BIOLOGICAL', description: 'Brother or sister sharing common parentage' },
    { code: 'GRANDPARENT', name: 'Grandparent - Grandchild', category: 'BIOLOGICAL', description: 'Two generations generational link' },
  ];

  const seededRelTypes = {};
  for (const rt of relationshipTypesData) {
    const existing = await prisma.relationshipType.findUnique({ where: { code: rt.code } });
    if (existing) {
      seededRelTypes[rt.code] = existing;
    } else {
      const created = await prisma.relationshipType.create({ data: rt });
      seededRelTypes[rt.code] = created;
    }
    console.log(`  ✓ RelType [${rt.code}]: "${rt.name}"`);
  }

  // ==========================================
  // 4. SEED 4-GENERATION FAMILY PERSONS
  // ==========================================
  console.log('\n🌳 Seeding 4-Generation Family Persons & Profiles...');

  const personsData = [
    // --- GENERATION 1: Great-Grandparents (Ancestors, Deceased) ---
    {
      key: 'gen1_sheikh',
      firstName: 'Sheikh Mujibur',
      lastName: 'Rahman',
      middleName: 'H.',
      nickname: 'Boro Abba',
      gender: 'MALE',
      dateOfBirth: new Date('1918-03-12'),
      dateOfDeath: new Date('1995-08-15'),
      isAlive: false,
      birthPlace: 'Tungipara, Gopalganj',
      occupation: 'Historian & Community Patriarch',
      city: 'Dhaka',
      country: 'Bangladesh',
      bio: 'Founding patriarch of our lineage. Dedicated his entire life to community leadership, oral storytelling, and establishing our ancestral estate.',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      familyRole: 'ADMIN',
    },
    {
      key: 'gen1_rokeya',
      firstName: 'Begum Rokeya',
      lastName: 'Rahman',
      middleName: 'Khatun',
      nickname: 'Boro Amma',
      gender: 'FEMALE',
      dateOfBirth: new Date('1924-06-20'),
      dateOfDeath: new Date('2002-11-04'),
      isAlive: false,
      birthPlace: 'Pairaband, Rangpur',
      occupation: 'Educator, Writer & Philanthropist',
      city: 'Dhaka',
      country: 'Bangladesh',
      bio: 'Beloved matriarch who championed women literacy and educational reform across rural Bengal. Kept the earliest family genealogy journal.',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      familyRole: 'ADMIN',
    },

    // --- GENERATION 2: Grandparents (Paternal & Maternal) ---
    {
      key: 'gen2_omar',
      firstName: 'Omar',
      lastName: 'Rahman',
      middleName: 'Farooq',
      nickname: 'Nana Bhai',
      gender: 'MALE',
      dateOfBirth: new Date('1944-08-14'),
      isAlive: true,
      birthPlace: 'Dhaka, Bangladesh',
      occupation: 'Retired Chief Civil Architect',
      city: 'Dhaka',
      country: 'Bangladesh',
      phone: '+880 1711 112233',
      bio: 'Patriarch of the modern Rahman sanctuary. Passionate about hand-drawn architectural blueprints, heritage gardening, and chess.',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      familyRole: 'ADMIN',
    },
    {
      key: 'gen2_fatima',
      firstName: 'Fatima',
      lastName: 'Rahman',
      middleName: 'Begum',
      nickname: 'Dadi Jan',
      gender: 'FEMALE',
      dateOfBirth: new Date('1948-12-05'),
      isAlive: true,
      birthPlace: 'Chittagong, Bangladesh',
      occupation: 'Botanist & Master Culinary Archivist',
      city: 'Dhaka',
      country: 'Bangladesh',
      bio: 'Family matriarch renowned for passing down centuries-old culinary recipes, medicinal herb remedies, and warm hospitality.',
      photoUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=400&q=80',
      familyRole: 'ADMIN',
    },
    {
      key: 'gen2_kamal',
      firstName: 'Dr. Kamal',
      lastName: 'Hossain',
      middleName: 'Ahmed',
      nickname: 'Dada',
      gender: 'MALE',
      dateOfBirth: new Date('1942-02-18'),
      dateOfDeath: new Date('2018-09-21'),
      isAlive: false,
      birthPlace: 'Khulna, Bangladesh',
      occupation: 'Chief Orthopedic Surgeon',
      city: 'London',
      country: 'United Kingdom',
      bio: 'Maternal grandfather who served four decades in medicine. A passionate philatelist and amateur astronomer.',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      familyRole: 'MEMBER',
    },
    {
      key: 'gen2_nargis',
      firstName: 'Nargis',
      lastName: 'Hossain',
      middleName: 'Sultana',
      nickname: 'Nani Amma',
      gender: 'FEMALE',
      dateOfBirth: new Date('1947-04-10'),
      isAlive: true,
      birthPlace: 'Rajshahi, Bangladesh',
      occupation: 'Silk Weaver & Folklorist',
      city: 'London',
      country: 'United Kingdom',
      bio: 'Maternal grandmother known for her exquisite traditional Nakshi Kantha tapestries capturing generational stories.',
      photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
      familyRole: 'MEMBER',
    },

    // --- GENERATION 3: Parents, Uncles, Aunts (Owner & Core Leaders) ---
    {
      key: 'gen3_tariq',
      userId: ownerUser.id,
      email: ownerUser.email,
      firstName: 'Tariq',
      lastName: 'Rahman',
      middleName: 'Hasan',
      nickname: 'Tareq',
      gender: 'MALE',
      dateOfBirth: new Date('1974-05-19'),
      isAlive: true,
      birthPlace: 'Dhaka, Bangladesh',
      occupation: 'Principal Cloud Architect',
      city: 'New York',
      country: 'United States',
      phone: '+1 (555) 234-5678',
      bio: 'Sanctuary Creator & Platform Founder. Overseeing digital preservation of our four-generation family lineage.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      familyRole: 'OWNER',
    },
    {
      key: 'gen3_amina',
      userId: seededUsers['admin@familyroots.io'].id,
      email: seededUsers['admin@familyroots.io'].email,
      firstName: 'Dr. Amina',
      lastName: 'Rahman',
      middleName: 'Kamal',
      nickname: 'Mini',
      gender: 'FEMALE',
      dateOfBirth: new Date('1978-09-25'),
      isAlive: true,
      birthPlace: 'London, United Kingdom',
      occupation: 'Pediatric Cardiologist',
      city: 'Boston',
      country: 'United States',
      phone: '+1 (555) 876-5432',
      bio: 'Co-Administrator and Tariq spouse. Passionate about medical outreach and preserving oral histories of the immigrant experience.',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      familyRole: 'ADMIN',
    },
    {
      key: 'gen3_rashid',
      firstName: 'Rashid',
      lastName: 'Rahman',
      middleName: 'Omar',
      nickname: 'Bablu',
      gender: 'MALE',
      dateOfBirth: new Date('1976-11-12'),
      isAlive: true,
      birthPlace: 'Dhaka, Bangladesh',
      occupation: 'Aerospace Engineering Director',
      city: 'London',
      country: 'United Kingdom',
      phone: '+44 7700 900123',
      bio: 'Brother to Tariq. Avid marathon runner, classic automobile restorer, and organizer of international European reunions.',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      familyRole: 'MEMBER',
    },
    {
      key: 'gen3_farah',
      firstName: 'Farah',
      lastName: 'Yasmin',
      middleName: 'N.',
      nickname: 'Rani',
      gender: 'FEMALE',
      dateOfBirth: new Date('1979-07-08'),
      isAlive: true,
      birthPlace: 'Toronto, Canada',
      occupation: 'Senior Photojournalist',
      city: 'London',
      country: 'United Kingdom',
      bio: 'Spouse of Rashid Rahman. National Geographic contributor whose lens captured hundreds of historical family events.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      familyRole: 'MEMBER',
    },
    {
      key: 'gen3_aisha',
      firstName: 'Aisha',
      lastName: 'Rahman',
      middleName: 'Zainab',
      nickname: 'Aishi',
      gender: 'FEMALE',
      dateOfBirth: new Date('1982-03-30'),
      isAlive: true,
      birthPlace: 'Dhaka, Bangladesh',
      occupation: 'Chief Museum Curator & Archivist',
      city: 'Melbourne',
      country: 'Australia',
      phone: '+61 411 234 567',
      bio: 'Sister to Tariq and Rashid. Leads the digitization and climate-controlled preservation of physical family heirlooms.',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      familyRole: 'MEMBER',
    },
    {
      key: 'gen3_kayesur',
      userId: seededUsers['rmdkayesur@gmail.com'].id,
      email: seededUsers['rmdkayesur@gmail.com'].email,
      firstName: 'Kayesur',
      lastName: 'Rahman',
      middleName: 'MD',
      nickname: 'Kayes',
      gender: 'MALE',
      dateOfBirth: new Date('1998-10-15'),
      isAlive: true,
      birthPlace: 'Dhaka, Bangladesh',
      occupation: 'Full-Stack Software Engineer',
      city: 'Dhaka',
      country: 'Bangladesh',
      phone: '+880 1712 345678',
      bio: 'Lead Platform Engineer. Building real-time interactive 2D lineage trees and encrypted document vault microservices.',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      familyRole: 'ADMIN',
    },

    // --- GENERATION 4: Children & Youth (Next Gen) ---
    {
      key: 'gen4_zayd',
      userId: seededUsers['member@familyroots.io'].id,
      email: seededUsers['member@familyroots.io'].email,
      firstName: 'Zayd',
      lastName: 'Rahman',
      middleName: 'Tariq',
      nickname: 'Zee',
      gender: 'MALE',
      dateOfBirth: new Date('2004-02-14'),
      isAlive: true,
      birthPlace: 'Boston, United States',
      occupation: 'Computer Science Undergraduate',
      city: 'New York',
      country: 'United States',
      phone: '+1 (555) 345-6789',
      bio: 'Eldest son of Tariq & Amina. Passionate about machine learning and compiling interactive AI family voice trees.',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      familyRole: 'MEMBER',
    },
    {
      key: 'gen4_layla',
      firstName: 'Layla',
      lastName: 'Rahman',
      middleName: 'Noor',
      nickname: 'Lulu',
      gender: 'FEMALE',
      dateOfBirth: new Date('2008-08-22'),
      isAlive: true,
      birthPlace: 'New York, United States',
      occupation: 'Visual Arts Student & Illustrator',
      city: 'New York',
      country: 'United States',
      bio: 'Daughter of Tariq & Amina. Talented young painter designing the visual heraldry and anniversary posters.',
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      familyRole: 'MEMBER',
    },
    {
      key: 'gen4_samiha',
      userId: seededUsers['viewer@familyroots.io'].id,
      email: seededUsers['viewer@familyroots.io'].email,
      firstName: 'Samiha',
      lastName: 'Rahman',
      middleName: 'Rashid',
      nickname: 'Sammy',
      gender: 'FEMALE',
      dateOfBirth: new Date('2006-04-18'),
      isAlive: true,
      birthPlace: 'London, United Kingdom',
      occupation: 'Psychology & Literature Student',
      city: 'London',
      country: 'United Kingdom',
      bio: 'Daughter of Rashid & Farah. Family chronicler compiling interview podcasts with grandparents Omar and Fatima.',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      familyRole: 'VIEWER',
    },
    {
      key: 'gen4_ibrahim',
      firstName: 'Ibrahim',
      lastName: 'Rahman',
      middleName: 'Rashid',
      nickname: 'Ibro',
      gender: 'MALE',
      dateOfBirth: new Date('2012-10-09'),
      isAlive: true,
      birthPlace: 'London, United Kingdom',
      occupation: 'Middle School Student & Robotics Club Lead',
      city: 'London',
      country: 'United Kingdom',
      bio: 'Son of Rashid & Farah. Youngest tech enthusiast who loves 3D printing and family drone photography.',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      familyRole: 'MEMBER',
    },
  ];

  const seededPersons = {};

  for (const p of personsData) {
    let personRecord = null;
    if (p.userId) {
      personRecord = await prisma.person.findUnique({ where: { userId: p.userId } });
    }
    if (!personRecord) {
      personRecord = await prisma.person.findFirst({
        where: {
          firstName: p.firstName,
          lastName: p.lastName,
        },
      });
    }

    const { key, familyRole, ...personFields } = p;

    if (personRecord) {
      personRecord = await prisma.person.update({
        where: { id: personRecord.id },
        data: personFields,
      });
    } else {
      personRecord = await prisma.person.create({
        data: personFields,
      });
    }

    seededPersons[key] = personRecord;

    // Connect to Sanctuary via FamilyMember
    await prisma.familyMember.upsert({
      where: {
        familyId_personId: {
          familyId: primaryFamily.id,
          personId: personRecord.id,
        },
      },
      update: {
        role: familyRole,
      },
      create: {
        familyId: primaryFamily.id,
        personId: personRecord.id,
        role: familyRole,
      },
    });

    console.log(`  ✓ Person [${p.gender}] ${p.firstName} ${p.lastName} (${personRecord.id}) -> Role: ${familyRole}`);
  }

  // ==========================================
  // 5. SEED COMPREHENSIVE RELATIONSHIPS MATRIX
  // ==========================================
  console.log('\n🧬 Linking Multi-Generational Relationship Matrix...');

  const parentChildRel = seededRelTypes['PARENT_CHILD'] || seededRelTypes['Parent ➔ Child'];
  const spouseRel = seededRelTypes['SPOUSE'] || seededRelTypes['Spouse / Married'];
  const siblingRel = seededRelTypes['SIBLING'];
  const grandparentRel = seededRelTypes['GRANDPARENT'];

  const relationshipsToCreate = [
    // Gen 1 -> Gen 2
    { from: 'gen1_sheikh', to: 'gen2_omar', type: parentChildRel },
    { from: 'gen1_rokeya', to: 'gen2_omar', type: parentChildRel },

    // Gen 2 Spouses
    { from: 'gen2_omar', to: 'gen2_fatima', type: spouseRel },
    { from: 'gen2_kamal', to: 'gen2_nargis', type: spouseRel },

    // Gen 2 -> Gen 3 (Paternal Omar & Fatima -> Tariq, Rashid, Aisha, Kayesur)
    { from: 'gen2_omar', to: 'gen3_tariq', type: parentChildRel },
    { from: 'gen2_fatima', to: 'gen3_tariq', type: parentChildRel },
    { from: 'gen2_omar', to: 'gen3_rashid', type: parentChildRel },
    { from: 'gen2_fatima', to: 'gen3_rashid', type: parentChildRel },
    { from: 'gen2_omar', to: 'gen3_aisha', type: parentChildRel },
    { from: 'gen2_fatima', to: 'gen3_aisha', type: parentChildRel },
    { from: 'gen2_omar', to: 'gen3_kayesur', type: parentChildRel },

    // Gen 2 Maternal Kamal & Nargis -> Amina
    { from: 'gen2_kamal', to: 'gen3_amina', type: parentChildRel },
    { from: 'gen2_nargis', to: 'gen3_amina', type: parentChildRel },

    // Gen 3 Spouses & Siblings
    { from: 'gen3_tariq', to: 'gen3_amina', type: spouseRel },
    { from: 'gen3_rashid', to: 'gen3_farah', type: spouseRel },
    { from: 'gen3_tariq', to: 'gen3_rashid', type: siblingRel },
    { from: 'gen3_tariq', to: 'gen3_aisha', type: siblingRel },
    { from: 'gen3_rashid', to: 'gen3_aisha', type: siblingRel },

    // Gen 3 -> Gen 4 (Tariq & Amina -> Zayd, Layla)
    { from: 'gen3_tariq', to: 'gen4_zayd', type: parentChildRel },
    { from: 'gen3_amina', to: 'gen4_zayd', type: parentChildRel },
    { from: 'gen3_tariq', to: 'gen4_layla', type: parentChildRel },
    { from: 'gen3_amina', to: 'gen4_layla', type: parentChildRel },

    // Gen 3 -> Gen 4 (Rashid & Farah -> Samiha, Ibrahim)
    { from: 'gen3_rashid', to: 'gen4_samiha', type: parentChildRel },
    { from: 'gen3_farah', to: 'gen4_samiha', type: parentChildRel },
    { from: 'gen3_rashid', to: 'gen4_ibrahim', type: parentChildRel },
    { from: 'gen3_farah', to: 'gen4_ibrahim', type: parentChildRel },

    // Gen 4 Siblings
    { from: 'gen4_zayd', to: 'gen4_layla', type: siblingRel },
    { from: 'gen4_samiha', to: 'gen4_ibrahim', type: siblingRel },

    // Grandparents -> Grandchildren
    { from: 'gen2_omar', to: 'gen4_zayd', type: grandparentRel },
    { from: 'gen2_fatima', to: 'gen4_layla', type: grandparentRel },
    { from: 'gen2_omar', to: 'gen4_samiha', type: grandparentRel },
  ];

  for (const rel of relationshipsToCreate) {
    const fromP = seededPersons[rel.from];
    const toP = seededPersons[rel.to];
    if (!fromP || !toP || !rel.type) continue;

    await prisma.relationship.upsert({
      where: {
        familyId_fromPersonId_toPersonId_relationshipTypeId: {
          familyId: primaryFamily.id,
          fromPersonId: fromP.id,
          toPersonId: toP.id,
          relationshipTypeId: rel.type.id,
        },
      },
      update: {
        status: 'ACTIVE',
      },
      create: {
        familyId: primaryFamily.id,
        fromPersonId: fromP.id,
        toPersonId: toP.id,
        relationshipTypeId: rel.type.id,
        status: 'ACTIVE',
        createdBy: ownerUser.id,
      },
    });
    console.log(`  ✓ Rel: ${fromP.firstName} -> [${rel.type.name}] -> ${toP.firstName}`);
  }

  // ==========================================
  // 6. SEED VAULT MEMORIES (MULTI-PHOTO & ISOLATED PERMISSIONS)
  // ==========================================
  console.log('\n📸 Seeding Archival Memories...');

  const memoriesData = [
    {
      title: 'Centennial Ancestral Homestead Restoration in Gopalganj',
      category: 'Heritage Milestone',
      date: '2024-03-25',
      location: 'Gopalganj Ancestral Estate',
      taggedMembers: 'Omar Rahman, Tariq Rahman, Aisha Rahman',
      privacy: 'Family',
      description:
        'A historic milestone as three generations gathered to complete the structural restoration of the 1920s brick manor built by Sheikh Mujibur Rahman. Every timber beam was hand-restored while preserving traditional lime plastering.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1542037104857-ffbb0b9152fb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
      ],
      sharedBy: 'Tariq Rahman',
    },
    {
      title: 'Grandpa Omar 80th Golden Milestone Jubilee Celebration',
      category: 'Anniversaries & Milestones',
      date: '2024-08-14',
      location: 'Pan Pacific Ballroom, Dhaka',
      taggedMembers: 'Omar Rahman, Fatima Rahman, Tariq, Amina, Zayd, Layla',
      privacy: 'Family',
      description:
        'Over 120 extended relatives from 8 countries gathered to honor Nana Bhai eight decades of leadership, resilience, and storytelling. Grandchildren presented a bound leather book of 80 oral anecdotes.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
      ],
      sharedBy: 'Dr. Amina Rahman',
    },
    {
      title: 'Traditional Winter Morning Pitha Festival & Heritage Tea',
      category: 'Traditions & Feasts',
      date: '2025-01-18',
      location: 'Dhaka Garden Rooftop',
      taggedMembers: 'Fatima Rahman, Layla Rahman, Samiha Rahman',
      privacy: 'Family',
      description:
        'Early sunrise mist, fresh date-palm molasses, and clay stove vapor cakes. Dadi Jan coached the teenage cousins on hand-folding steamed delicacies passed down across seven generations.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
      ],
      sharedBy: 'Fatima Rahman',
    },
    {
      title: 'Zayd Honors Computer Science Graduation at NYU',
      category: 'Academic Milestones',
      date: '2025-05-22',
      location: 'Radio City Music Hall, New York',
      taggedMembers: 'Zayd Rahman, Tariq Rahman, Dr. Amina Rahman',
      privacy: 'Family',
      description:
        'A proud day celebrating Zayd graduating Magna Cum Laude. Grandpa Omar sent a heartfelt blessing video call from Dhaka in real-time as Zayd walked the ceremonial stage.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
      ],
      sharedBy: 'Zayd Rahman',
    },
    {
      title: 'First International Cousins Camping Expedition at White Mountains',
      category: 'Family Adventures',
      date: '2025-07-10',
      location: 'Mount Washington State Park, New Hampshire',
      taggedMembers: 'Zayd, Layla, Samiha, Ibrahim, Kayesur',
      privacy: 'Family',
      description:
        'All five Generation 4 cousins spent four days hiking through mountain passes and sharing constellation lore under alpine skies. Campfire stories reconnected childhood memories across continents.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
      ],
      sharedBy: 'Kayesur Rahman',
    },
    {
      title: 'Discovery of the 1970 Vintage Silver Wedding Album',
      category: 'Historical Heirlooms',
      date: '2025-09-14',
      location: 'Sylhet Attic Archives',
      taggedMembers: 'Omar Rahman, Fatima Rahman, Aisha Rahman',
      privacy: 'Family',
      description:
        'A priceless archival find: a preserved velvet box containing over 80 black-and-white Kodachrome silver gelatin prints from Omar and Fatima wedding ceremony. High-resolution scans now preserved in the encrypted digital vault.',
      mediaUrls: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
      ],
      sharedBy: 'Aisha Rahman',
    },
  ];

  // Seed memories with multiple user email tags so whoever logs in sees rich memories
  const recipientUsers = [
    ownerUser,
    seededUsers['admin@familyroots.io'],
    seededUsers['member@familyroots.io'],
    seededUsers['rmdkayesur@gmail.com'],
  ];

  for (const m of memoriesData) {
    for (const u of recipientUsers) {
      const metaParts = [];
      if (m.category) metaParts.push(`Category: ${m.category}`);
      if (m.date) metaParts.push(`Date: ${m.date}`);
      if (m.location) metaParts.push(`Location: ${m.location}`);
      if (m.taggedMembers) metaParts.push(`Tagged: ${m.taggedMembers}`);
      if (m.privacy) metaParts.push(`Privacy: ${m.privacy}`);
      const combinedDesc = `${metaParts.join(' • ')}\n\n${m.description}`;

      await prisma.memory.create({
        data: {
          familyId: primaryFamily.id,
          userId: u.id,
          userEmail: u.email,
          title: m.title,
          description: combinedDesc,
          sharedBy: m.sharedBy,
          mediaUrl: JSON.stringify(m.mediaUrls),
          photoCount: m.mediaUrls.length,
        },
      });
    }
    console.log(`  ✓ Memory: "${m.title}" (${m.mediaUrls.length} photos)`);
  }

  // ==========================================
  // 7. SEED UPCOMING & PAST CALENDAR EVENTS
  // ==========================================
  console.log('\n📅 Seeding Calendar Events (Active Upcoming & Inactive Past)...');

  const eventsData = [
    // --- ACTIVE UPCOMING EVENTS (Post Oct 13, 2026) ---
    {
      title: 'Grand Annual Rahman Dynasty Gala & Heirlooms Exhibition',
      date: new Date('2026-11-28'),
      location: 'Grand Ballroom, InterContinental Hotel, Dhaka',
      description:
        'Our premier global family summit. Includes formal family banquet, live audio-visual archival projection, showcase of newly discovered manuscripts, and Generation 4 talent performances.',
      isVirtual: false,
    },
    {
      title: 'Grandpa Omar 82nd Milestone Birthday Gathering',
      date: new Date('2026-12-15'),
      location: 'Rahman Ancestral Manor, Gopalganj',
      description:
        'A warm winter milestone celebration honoring Nana Bhai. Traditional banquet with family elders, poetry readings, and outdoor orchard tea.',
      isVirtual: false,
    },
    {
      title: 'Winter Family Wilderness Retreat & Barbecue',
      date: new Date('2027-01-10'),
      location: 'Grand Sultan Tea Resort, Srimangal, Sylhet',
      description:
        'A 3-day family wellness retreat exploring organic tea gardens, rainforest nature trails, and evening acoustic fireside storytelling sessions.',
      isVirtual: false,
    },
    {
      title: 'Global Cousins Virtual Tech & Creative Showcase',
      date: new Date('2027-02-05'),
      location: 'Zoom & Google Meet Sanctuary Room',
      description:
        'An online international meetup for cousins in the US, UK, Canada, Australia, and Bangladesh to showcase university projects, art portfolios, and lineage tree improvements.',
      isVirtual: true,
    },
    {
      title: 'Spring Heritage Mango Orchard Planting Weekend',
      date: new Date('2027-03-20'),
      location: 'Rahman Family Agricultural Orchards, Rajshahi',
      description:
        'Planting 50 commemorative mango saplings in honor of ancestors Sheikh Mujibur and Begum Rokeya, creating a living legacy garden.',
      isVirtual: false,
    },

    // --- INACTIVE PAST EVENTS (Pre Oct 13, 2026 - for testing history filters) ---
    {
      title: 'Summer Eid al-Adha Grand Feast 2026',
      date: new Date('2026-06-18'),
      location: 'Rahman Family Estate Hall, Dhaka',
      description:
        'Annual holiday celebration with community charity distribution, traditional mezbani beef stew, and extended family portraits.',
      isVirtual: false,
    },
    {
      title: 'Spring Genealogy Discovery & Digitization Workshop 2026',
      date: new Date('2026-04-12'),
      location: 'Sanctuary Virtual Archives Link',
      description:
        'Interactive webinar led by Aisha Rahman training younger cousins on using high-resolution document scanners and metadata tagging.',
      isVirtual: true,
    },
  ];

  for (const ev of eventsData) {
    const existing = await prisma.event.findFirst({
      where: { familyId: primaryFamily.id, title: ev.title },
    });
    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data: ev,
      });
    } else {
      await prisma.event.create({
        data: {
          familyId: primaryFamily.id,
          ...ev,
        },
      });
    }
    console.log(`  ✓ Event [${ev.date.toISOString().split('T')[0]}]: "${ev.title}" (Virtual: ${ev.isVirtual})`);
  }

  // ==========================================
  // 8. SEED VAULT LEGAL & HISTORICAL DOCUMENTS
  // ==========================================
  console.log('\n📄 Seeding Encrypted Document Vault...');

  const samplePdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  const documentsData = [
    {
      name: 'Rahman_Family_Heritage_Will_&_Trust_1954.pdf',
      category: 'Legal Records',
      size: '4.2 MB',
      fileUrl: samplePdf,
      uploadedBy: 'Tariq Rahman',
    },
    {
      name: 'Grandpa_Omar_Official_Birth_Certificate_Scanned.pdf',
      category: 'Vital Records',
      size: '1.8 MB',
      fileUrl: samplePdf,
      uploadedBy: 'Aisha Rahman',
    },
    {
      name: 'Ancestral_Homestead_Land_Deed_Gopalganj_1932.pdf',
      category: 'Legal Records',
      size: '8.4 MB',
      fileUrl: samplePdf,
      uploadedBy: 'Sheikh Mujibur Rahman',
    },
    {
      name: 'Family_Immigration_Passports_&_Diplomatic_Visas_1975.pdf',
      category: 'Immigration',
      size: '12.5 MB',
      fileUrl: samplePdf,
      uploadedBy: 'Omar Rahman',
    },
    {
      name: 'Generational_Endowment_Charitable_Trust_Charter_2020.pdf',
      category: 'Financial',
      size: '3.1 MB',
      fileUrl: samplePdf,
      uploadedBy: 'Tariq Rahman',
    },
    {
      name: 'Royal_College_of_Surgeons_Fellowship_Diploma_Dr_Kamal.pdf',
      category: 'Certificates',
      size: '2.4 MB',
      fileUrl: samplePdf,
      uploadedBy: 'Dr. Amina Rahman',
    },
    {
      name: 'Generational_Health_&_Bloodline_Genetics_Compendium.pdf',
      category: 'Vital Records',
      size: '5.6 MB',
      fileUrl: samplePdf,
      uploadedBy: 'Dr. Amina Rahman',
    },
    {
      name: 'Original_Tea_Orchard_Purchase_Contract_1965.pdf',
      category: 'Historical Deeds',
      size: '6.9 MB',
      fileUrl: samplePdf,
      uploadedBy: 'Omar Rahman',
    },
  ];

  for (const doc of documentsData) {
    const existing = await prisma.document.findFirst({
      where: { familyId: primaryFamily.id, name: doc.name },
    });
    if (existing) {
      await prisma.document.update({
        where: { id: existing.id },
        data: doc,
      });
    } else {
      await prisma.document.create({
        data: {
          familyId: primaryFamily.id,
          ...doc,
        },
      });
    }
    console.log(`  ✓ Document [${doc.category}]: "${doc.name}" (${doc.size})`);
  }

  // ==========================================
  // 9. SEED SANCTUARY INVITATIONS
  // ==========================================
  console.log('\n✉️ Seeding Sanctuary Invitations...');

  const invitationsData = [
    {
      name: 'Farhan Ahmed Rahman',
      email: 'farhan.ahmed@sydney.edu.au',
      role: 'MEMBER',
      status: 'PENDING',
      note: 'Second cousin currently in Sydney requesting branch access for oral history research.',
    },
    {
      name: 'Nadia Sultana Hossain',
      email: 'nadia.hossain@oxfordalumni.org',
      role: 'VIEWER',
      status: 'PENDING',
      note: 'Wants view-only observer access to browse grandparents vintage wedding photos.',
    },
    {
      name: 'Dr. Bilal Rahman',
      email: 'dr.bilal.rahman@torontoclinic.ca',
      role: 'ADMIN',
      status: 'APPROVED',
      note: 'Accepted sanctuary co-administration invitation to help verify North American branches.',
    },
    {
      name: 'Mariam Chowdhury',
      email: 'mariam.chowdhury@sylhetfolk.org',
      role: 'MEMBER',
      status: 'APPROVED',
      note: 'Maternal cousin from Sylhet accepted lineage membership.',
    },
    {
      name: 'Unknown Request Flagged',
      email: 'suspicious_requester@tempmail.ninja',
      role: 'MEMBER',
      status: 'REJECTED',
      note: 'Rejected: Unable to corroborate direct ancestral connection with sanctuary council.',
    },
  ];

  for (const inv of invitationsData) {
    const existing = await prisma.invitation.findFirst({
      where: { familyId: primaryFamily.id, email: inv.email },
    });
    if (existing) {
      await prisma.invitation.update({
        where: { id: existing.id },
        data: inv,
      });
    } else {
      await prisma.invitation.create({
        data: {
          familyId: primaryFamily.id,
          ...inv,
        },
      });
    }
    console.log(`  ✓ Invitation [${inv.status} - ${inv.role}]: ${inv.name} <${inv.email}>`);
  }

  // ==========================================
  // 10. SEED ACTIVE DYNASTY SUBSCRIPTION (BILLING)
  // ==========================================
  console.log('\n💳 Seeding Active Dynasty Unlimited Subscription...');

  const sub = await prisma.subscription.upsert({
    where: { familyId: primaryFamily.id },
    update: {
      userId: ownerUser.id,
      tier: 'DYNASTY_UNLIMITED',
      status: 'ACTIVE',
      interval: 'YEARLY',
      storageLimitMb: 102400, // 100 GB
      storageUsedMb: 44.8,
      maxMembersLimit: 250,
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2027-01-01'),
      cancelAtPeriodEnd: false,
    },
    create: {
      familyId: primaryFamily.id,
      userId: ownerUser.id,
      tier: 'DYNASTY_UNLIMITED',
      status: 'ACTIVE',
      interval: 'YEARLY',
      storageLimitMb: 102400,
      storageUsedMb: 44.8,
      maxMembersLimit: 250,
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2027-01-01'),
      cancelAtPeriodEnd: false,
    },
  });
  console.log(`  ✓ Subscription: Tier "${sub.tier}" (${sub.status}) - Storage: ${sub.storageLimitMb} MB`);

  console.log('\n🎉 ALL COLLECTIONS & MODELS SEEDED WITH RICH DATA SUCCESSFULLY!');
}

seed()
  .catch((err) => {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
