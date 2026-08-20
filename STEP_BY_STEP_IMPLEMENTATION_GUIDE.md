# FamilyRoots — Step-by-Step Implementation Guide

> **Project Architecture:** Next.js + NestJS + PostgreSQL + Prisma + Redis  
> **Core Concept:** Decoupled `User` (Authentication Identity) and `Person` (Canonical Family Graph Node)

---

## Overview & Implementation Roadmap

```
[Phase 1: Database Schema Expansion] 
         ↓
[Phase 2: Person & Family Modules] 
         ↓
[Phase 3: Relationship Engine] 
         ↓
[Phase 4: Family Tree API & Graph Traversal] 
         ↓
[Phase 5: Discovery System & Add Relative UX Backend] 
         ↓
[Phase 6: Person Claiming & Linking] 
         ↓
[Phase 7: Memories, Events & Documents] 
         ↓
[Phase 8: Redis Caching, Queues & Notifications] 
         ↓
[Phase 9: Next.js Frontend Integration] 
         ↓
[Phase 10: E2E Testing, Auditing & Deployment]
```

---

## Phase 1: Database Schema Expansion (Prisma)

### Step 1.1: Define Enums & Core Models in `prisma/schema.prisma`

Add the core domain models to `prisma/schema.prisma`:

```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
  UNKNOWN
}

enum FamilyRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum DiscoveryVisibility {
  PUBLIC
  FAMILY
  SELECTED
  PRIVATE
}

enum ClaimStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum RelationshipStatus {
  ACTIVE
  ENDED
  PENDING_VERIFICATION
}

// ----------------------------------------------------
// Person Model (Decoupled from User)
// ----------------------------------------------------
model Person {
  id                  String              @id @default(uuid())
  userId              String?             @unique @map("user_id") // Nullable link to User account
  firstName           String              @map("first_name")
  middleName          String?             @map("middle_name")
  lastName            String?             @map("last_name")
  nickname            String?
  gender              Gender              @default(UNKNOWN)
  dateOfBirth         DateTime?           @map("date_of_birth") @db.Date
  dateOfDeath         DateTime?           @map("date_of_death") @db.Date
  isAlive             Boolean             @default(true) @map("is_alive")
  birthPlace          String?             @map("birth_place")
  occupation          String?
  phone               String?
  email               String?
  city                String?
  country             String?
  bio                 String?             @db.Text
  photoUrl            String?             @map("photo_url")
  discoveryVisibility DiscoveryVisibility @default(PUBLIC) @map("discovery_visibility")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Relations
  user              User?               @relation(fields: [userId], references: [id], onDelete: SetNull)
  familyMemberships FamilyMember[]
  fromRelationships Relationship[]      @relation("FromPerson")
  toRelationships   Relationship[]      @relation("ToPerson")
  claims            PersonClaim[]       @relation("ClaimedPerson")
  aliases           PersonAlias[]

  @@map("persons")
}

// ----------------------------------------------------
// Family & Membership
// ----------------------------------------------------
model Family {
  id          String         @id @default(uuid())
  name        String
  description String?
  avatarUrl   String?        @map("avatar_url")
  createdBy   String         @map("created_by")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")
  deletedAt   DateTime?      @map("deleted_at")

  members       FamilyMember[]
  relationships Relationship[]

  @@map("families")
}

model FamilyMember {
  id        String     @id @default(uuid())
  familyId  String     @map("family_id")
  personId  String     @map("person_id")
  role      FamilyRole @default(MEMBER)
  joinedAt  DateTime   @default(now()) @map("joined_at")
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")

  family Family @relation(fields: [familyId], references: [id], onDelete: Cascade)
  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@unique([familyId, personId])
  @@map("family_members")
}

// ----------------------------------------------------
// Graph Relationships
// ----------------------------------------------------
model RelationshipType {
  id          String   @id @default(uuid())
  code        String   @unique // e.g. PARENT, CHILD, SIBLING, SPOUSE
  name        String   // Display name
  category    String   @default("BIOLOGICAL") // BIOLOGICAL, LEGAL, SOCIAL
  inverseCode String?  @map("inverse_code") // e.g. PARENT -> CHILD
  description String?
  isSystem    Boolean  @default(true) @map("is_system")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  relationships Relationship[]

  @@map("relationship_types")
}

model Relationship {
  id                 String             @id @default(uuid())
  familyId           String             @map("family_id")
  fromPersonId       String             @map("from_person_id")
  toPersonId         String             @map("to_person_id")
  relationshipTypeId String             @map("relationship_type_id")
  status             RelationshipStatus @default(ACTIVE)
  startDate          DateTime?          @map("start_date") @db.Date
  endDate            DateTime?          @map("end_date") @db.Date
  createdBy          String             @map("created_by")
  createdAt          DateTime           @default(now()) @map("created_at")
  updatedAt          DateTime           @updatedAt @map("updated_at")

  family           Family           @relation(fields: [familyId], references: [id], onDelete: Cascade)
  fromPerson       Person           @relation("FromPerson", fields: [fromPersonId], references: [id], onDelete: Cascade)
  toPerson         Person           @relation("ToPerson", fields: [toPersonId], references: [id], onDelete: Cascade)
  relationshipType RelationshipType @relation(fields: [relationshipTypeId], references: [id])

  @@unique([familyId, fromPersonId, toPersonId, relationshipTypeId])
  @@map("relationships")
}

// ----------------------------------------------------
// Discovery & Claims
// ----------------------------------------------------
model PersonClaim {
  id          String      @id @default(uuid())
  personId    String      @map("person_id")
  userId      String      @map("user_id")
  status      ClaimStatus @default(PENDING)
  requestedAt DateTime    @default(now()) @map("requested_at")
  reviewedAt  DateTime?   @map("reviewed_at")
  reviewedBy  String?     @map("reviewed_by")
  notes       String?

  person Person @relation("ClaimedPerson", fields: [personId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("person_claims")
}

model PersonAlias {
  id              String   @id @default(uuid())
  personId        String   @map("person_id")
  alias           String
  normalizedAlias String   @map("normalized_alias")
  aliasType       String?  @map("alias_type") // MAIDEN_NAME, NICKNAME, FORMER_NAME
  createdAt       DateTime @default(now()) @map("created_at")

  person Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@map("person_aliases")
}
```

### Step 1.2: Execute Database Migration

Run the following commands:
```bash
npx prisma migrate dev --name init_family_graph_schema
npx prisma generate
```

---

## Phase 2: Core NestJS Backend Modules

### Step 2.1: `PersonsModule` Setup

Create `src/persons/persons.service.ts` to manage Person entities:

* **Key Methods:**
  * `createPerson(dto: CreatePersonDto)`
  * `findPersonById(id: string, requestingUserId: string)`
  * `updatePerson(id: string, dto: UpdatePersonDto)`
  * `searchDiscoverablePersons(query: string, filters: SearchFilters)`

### Step 2.2: `FamiliesModule` & `FamilyMembersModule` Setup

* **Role Guard Enforcement:**
  * Define `@FamilyRoleGuard()` decorator to protect endpoint access by family membership role (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).
* **Key Methods:**
  * `createFamily(userId: string, dto: CreateFamilyDto)`: Automatically adds the user's `Person` as `OWNER`.
  * `addMemberToFamily(familyId: string, personId: string, role: FamilyRole)`.

---

## Phase 3: Relationship Engine Implementation

### Step 3.1: Seed System Relationship Types

Create seed script `prisma/seed.ts`:

```typescript
const systemTypes = [
  { code: 'PARENT', name: 'Parent', inverseCode: 'CHILD', category: 'BIOLOGICAL' },
  { code: 'CHILD', name: 'Child', inverseCode: 'PARENT', category: 'BIOLOGICAL' },
  { code: 'SPOUSE', name: 'Spouse', inverseCode: 'SPOUSE', category: 'LEGAL' },
  { code: 'SIBLING', name: 'Sibling', inverseCode: 'SIBLING', category: 'BIOLOGICAL' },
  { code: 'GRANDPARENT', name: 'Grandparent', inverseCode: 'GRANDCHILD', category: 'BIOLOGICAL' },
  { code: 'GRANDCHILD', name: 'Grandchild', inverseCode: 'GRANDPARENT', category: 'BIOLOGICAL' },
  { code: 'UNCLE', name: 'Uncle', inverseCode: 'NEPHEW_NIECE', category: 'BIOLOGICAL' },
  { code: 'AUNT', name: 'Aunt', inverseCode: 'NEPHEW_NIECE', category: 'BIOLOGICAL' },
  { code: 'FRIEND', name: 'Friend', inverseCode: 'FRIEND', category: 'SOCIAL' },
];
```

### Step 3.2: Relationship Service & Transactional Creation

In `src/relationships/relationships.service.ts`:

```typescript
async createRelationship(dto: CreateRelationshipDto, userId: string) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Verify family membership of both fromPerson and toPerson
    // 2. Lookup relationship type & inverse code
    // 3. Create directional edge (fromPerson -> toPerson)
    // 4. If inverse relationship type exists, create inverse edge (toPerson -> fromPerson)
    // 5. Invalidate Family Tree cache in Redis
    // 6. Log activity event
  });
}
```

---

## Phase 4: Family Tree API & Graph Traversal Algorithm

### Step 4.1: Root-Based Traversal Service

In `src/family-tree/family-tree.service.ts`:

```typescript
async getFamilyTree(familyId: string, rootPersonId: string, depth: number = 3) {
  // 1. Check Redis cache for key `family:${familyId}:tree:${rootPersonId}:depth:${depth}`
  // 2. If missed: Execute recursive graph fetch from PostgreSQL
  // 3. Construct Tree Node DTO:
  //    {
  //       id: string,
  //       name: string,
  //       photoUrl: string,
  //       gender: Gender,
  //       parents: TreeNode[],
  //       spouses: TreeNode[],
  //       children: TreeNode[],
  //       siblings: TreeNode[]
  //    }
  // 4. Store in Redis with TTL (e.g. 1 hour)
  // 5. Return tree DTO
}
```

---

## Phase 5: Existing Person Discovery & Add Relative Flow

### Step 5.1: Search & Candidate Ranking

In `src/discovery/discovery.service.ts`:

```typescript
async searchCandidates(query: string, currentUserId: string) {
  const normalized = query.trim().toLowerCase();
  
  // Search Persons matching normalized name or aliases
  // Respect discoveryVisibility:
  // - PUBLIC: Appears in candidate list
  // - FAMILY: Appears only if requester shares a family space
  // - PRIVATE: Never returned in public search
  
  // Return sanitized candidate DTO (no private contact info)
}
```

### Step 5.2: Main Add Member API Endpoint

`POST /families/:id/members`

```json
// Option A: Link Existing Person
{
  "mode": "EXISTING",
  "personId": "p100-uuid",
  "relationshipType": "FRIEND"
}

// Option B: Create New Person
{
  "mode": "NEW",
  "relationshipType": "FATHER",
  "person": {
    "firstName": "Abdul",
    "lastName": "Karim",
    "gender": "MALE",
    "dateOfBirth": "1965-04-12"
  }
}
```

---

## Phase 6: Person Claiming & Linking System

### Step 6.1: Claim Request Workflow

1. User `U` initiates `POST /persons/:personId/claim`.
2. System creates `PersonClaim` record in `PENDING` state.
3. System sends notification/email to Family `OWNER`/`ADMIN`.
4. Family `OWNER` approves `PATCH /person-claims/:claimId/approve`.
5. Transaction sets `Person.userId = User.id` and updates claim status.

---

## Phase 7: Media, Memories, Events & Documents

### Step 7.1: S3 Media Presigned URL Flow

```
Client  --> Request Upload URL (POST /uploads/presigned-url)  --> NestJS
NestJS  --> Sign S3 PUT URL + Generate Object Key           --> Client
Client  --> Upload file directly to S3 Bucket
Client  --> Submit Metadata (POST /memories) with Object Key --> NestJS
```

---

## Phase 8: Next.js Frontend Integration Plan

### Component Architecture Strategy

```
app/
├── (auth)/login & register
├── dashboard/
└── families/[familyId]/
    ├── tree/             <-- Interactive Tree Canvas (React Flow / D3)
    ├── members/          <-- Member List & Add Relative Modal Wizard
    ├── memories/         <-- Gallery Grid & Upload Modal
    └── settings/         <-- Family Roles & Visibility
```

---

## Phase 9: Verification & Testing Checklist

- [ ] **Unit Tests:** Inverse relationship calculation, name normalization.
- [ ] **Integration Tests:** `POST /families/:id/members` for both `NEW` and `EXISTING` modes.
- [ ] **Transaction Safety Test:** Concurrent relationship updates rollback cleanly on collision.
- [ ] **Privacy Test:** Searching a `PRIVATE` person returns empty candidates.
- [ ] **Tree API Performance:** Tree depth 4 loads in `<150ms` using Redis cache.

---
*Created automatically for FamilyRoots Project Implementation.*
