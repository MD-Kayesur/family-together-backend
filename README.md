# 🛡️ FamilyRoots — Backend API Server

> **Scalable, Multi-Tenant, Privacy-First Family Tree & Lineage Archive REST API.**  
> Powered by NestJS 11, Prisma ORM 7 (SQL Driver Adapter), PostgreSQL, JWT Auth, and OpenAPI (Swagger).

[![Live API](https://img.shields.io/badge/Live%20API-Vercel-6366f1?style=for-the-badge&logo=vercel)](https://family-together-backend.vercel.app)
[![Swagger Specs](https://img.shields.io/badge/Swagger%20UI-OpenAPI-85ea2d?style=for-the-badge&logo=swagger)](https://family-together-backend.vercel.app/api/docs)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-ea2845?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma%20ORM-7.x-2d3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169e1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Live Endpoints & Interactive Documentation](#-live-endpoints--interactive-documentation)
- [Key Architectural Features](#-key-architectural-features)
- [User Roles & Security Guards](#-user-roles--security-guards)
- [Database Schema (Prisma 7)](#-database-schema-prisma-7)
- [API Modules Overview](#-api-modules-overview)
- [Environment Configuration](#-environment-configuration)
- [Local Setup & Development](#-local-setup--development)
- [Database Migration Commands](#-database-migration-commands)
- [API Endpoint Reference](#-api-endpoint-reference)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## 🚀 Overview

The **FamilyRoots Backend** provides high-performance, secure backend services for managing family sanctuaries, multi-generational lineage trees, memory vaults, relative deduplication, and account activation workflows.

### 🌐 Live Production Server
- **Production API:** `https://family-together-backend.vercel.app/api`
- **Interactive Swagger UI:** 👉 **[https://family-together-backend.vercel.app/api/docs](https://family-together-backend.vercel.app/api/docs)**

---

## 📚 Live Endpoints & Interactive Documentation

When running locally (`npm run start:dev`), test all API endpoints interactively via Swagger UI:

👉 **`http://localhost:3000/api/docs`**

Features provided by Swagger UI:
- Interactive endpoint execution (`Try it out`).
- Automatic JWT Authorization header injection.
- Request/Response DTO schema visualization.

---

## ⚡ Key Architectural Features

### 🛡️ 1. Multi-Tenant Family Sanctuary Isolation
- Every family entity operates as a distinct isolated tenant.
- Strict data guards prevent unauthorized access to external family trees or media vaults.

### 🔍 2. Real-Time Relative Deduplication Engine
- Validates incoming family members against existing records by combining fuzzy name matching and email lookup.
- Alerts administrators instantly when duplicate relative profiles are detected to preserve tree integrity.

### 🔔 3. Account Creation & Activation Notifications
- When an Admin creates a family member with a valid email, an automated activation workflow is triggered.
- Generates account activation codes and notifies users in real-time via the navbar notification service.

### 🔐 4. Modern Prisma ORM 7 Driver Adapter Architecture
- Configured with PostgreSQL Driver Adapter (`@prisma/adapter-pg`) for optimized connection pooling and serverless execution.
- Multi-file schema organization (`prisma/schema/*.prisma`).

---

## 👥 User Roles & Security Guards

System authorization is enforced using NestJS Execution Guards and custom `@Roles()` decorators:

```ts
export enum Role {
  OWNER = 'OWNER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}
```

### Authorization Rules:
- **OWNER / SUPER_ADMIN:** Full CRUD privileges over users, roles, families, deduplication logs, and system settings.
- **ADMIN:** Can add family members, resolve deduplication flags, manage relationships, and upload vault assets.
- **MEMBER:** Read access to family trees, ability to upload personal memories, and edit profile details.
- **VIEWER:** Restricted strictly to public website reading (`/`). Blocked from all private family tree APIs.

---

## 🗄️ Database Schema (Prisma 7)

FamilyRoots uses Prisma ORM 7's multi-file schema feature (`prisma/schema/`):

```
prisma/schema/
├── base.prisma          # User, Role Enums, Account Credentials
├── family.prisma        # Family Sanctuary & Workspace Tenant Models
├── person.prisma        # FamilyMember & Lineage Node Schemas
├── relationship.prisma  # Parent-Child, Spouse, Sibling Relationships
└── vault.prisma         # Memory Vault, Scanned Documents, Events
```

### Core Data Models:
- **User:** Primary user account, email verification, hashed password, role assignment.
- **Family:** Family sanctuary container, owner reference, subscription tier status.
- **FamilyMember:** Individual node in the family tree, date of birth, bio, avatar, and relationship pointers.
- **Relationship:** Explicit directional edges connecting nodes (Father, Mother, Spouse, Child, Sibling).
- **Memory & Document:** Vault items linked to specific family members.

---

## 🧩 API Modules Overview

```
src/
├── auth/          # JWT Authentication, Registration, Login, Token Refresh
├── users/         # User Management, Role Updates, Account Activation
├── family/        # Family Sanctuary Creation, Member Management, Deduplication
├── mail/          # Email Activation & Notification Service
├── prisma/        # Prisma 7 Database Service & Connection Pool
└── redis/         # Caching & Session Store Handler
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,https://family-together-eta.vercel.app

# PostgreSQL Connection String (Neon / Supabase / Prisma Postgres)
DATABASE_URL="postgresql://user:password@ep-example.region.aws.neon.tech/familyroots?sslmode=require"

# JWT Authentication Secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRATION=7d

# Email Configuration (Nodemailer / Resend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🚀 Local Setup & Development

### Prerequisites
- **Node.js**: v18.x or v20.x or higher
- **npm**: v9.x or higher
- **PostgreSQL**: Local or cloud instance (Neon / Supabase)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MD-Kayesur/family-together-backend.git
   cd family-together-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Run development server:**
   ```bash
   npm run start:dev
   ```
   Open **`http://localhost:3000/api/docs`** for interactive Swagger documentation.

---

## 🗃️ Database Migration Commands

```bash
# Push schema changes to database
npx prisma db push

# Generate fresh Prisma Client
npx prisma generate

# Open Prisma Studio GUI
npx prisma studio

# Seed initial admin user & sample family data
npx ts-node prisma/seed.ts
```

---

## 📋 API Endpoint Reference

| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register new user account | Public |
| **POST** | `/api/auth/login` | Authenticate user & receive JWT | Public |
| **GET** | `/api/auth/me` | Fetch authenticated user profile | Authenticated |
| **GET** | `/api/family` | Get user family sanctuary details | MEMBER+ |
| **POST** | `/api/family/members` | Add new relative to tree (with deduplication) | ADMIN+ |
| **GET** | `/api/family/members` | Fetch family tree nodes | MEMBER+ |
| **GET** | `/api/users` | List all system users | OWNER / SUPER_ADMIN |
| **PATCH** | `/api/users/:id/role` | Update user role | OWNER / SUPER_ADMIN |

---

## 📦 Production Deployment

The backend server is deployed on **Vercel Serverless Functions**:

```bash
# Deploy backend to Vercel Production
vercel --prod --yes
```

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for more information.

Developed with ❤️ by **MD Kayesur** & the FamilyRoots Team.
