# 🛡️ FamilyRoots — Backend API Server

> **Scalable, Multi-Tenant, Privacy-First Family Tree & Lineage Archive REST API Server.**

[![Live API](https://img.shields.io/badge/Live%20API-Vercel-6366f1?style=for-the-badge&logo=vercel)](https://family-together-backend.vercel.app)
[![Swagger Specs](https://img.shields.io/badge/Swagger%20UI-OpenAPI-85ea2d?style=for-the-badge&logo=swagger)](https://family-together-backend.vercel.app/api/docs)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Live Endpoints & Interactive OpenAPI Docs](#-live-endpoints--interactive-openapi-docs)
- [Key Architectural Features](#-key-architectural-features)
- [User Roles & Authorization Guards](#-user-roles--authorization-guards)
- [Database Models & Schema](#-database-models--schema)
- [API Modules Structure](#-api-modules-structure)
- [Environment Configuration](#-environment-configuration)
- [Getting Started & Local Development](#-getting-started--local-development)
- [Database Commands](#-database-commands)
- [API Endpoint Reference](#-api-endpoint-reference)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## 🚀 Project Overview

The **FamilyRoots Backend API Server** provides secure, high-performance services for managing family sanctuaries, multi-generational lineage trees, memory vaults, real-time relative deduplication, and automated account activation workflows.

### 🌐 Live Production API & Swagger Docs
- **Production API URL:** `https://family-together-backend.vercel.app/api`
- **Interactive Swagger Documentation:** 👉 **[https://family-together-backend.vercel.app/api/docs](https://family-together-backend.vercel.app/api/docs)**

---

## 📚 Live Endpoints & Interactive OpenAPI Docs

When running locally (`npm run start:dev`), test all API endpoints interactively via Swagger UI:

👉 **`http://localhost:3000/api/docs`**

Features provided in Swagger UI:
- Interactive endpoint execution (`Try it out`).
- Automatic JWT Bearer Token authorization header injection.
- Request/Response DTO schema specifications.

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

### 🔐 4. High-Performance SQL Driver Adapter Connection
- Configured with custom database connection adapters for optimized connection pooling and serverless execution.
- Multi-file database schema organization (`prisma/schema/*.prisma`).

---

## 👥 User Roles & Authorization Guards

System authorization is enforced using strict role guards and permission decorators:

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

## 🗄️ Database Models & Schema

FamilyRoots utilizes structured multi-file database schema definitions (`prisma/schema/`):

```
prisma/schema/
├── base.prisma          # User Account, Role Enums, Credentials
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

## 🧩 API Modules Structure

```
src/
├── auth/          # Authentication, Registration, Login, Token Refresh
├── users/         # User Management, Role Updates, Account Activation
├── family/        # Family Sanctuary Creation, Member Management, Deduplication
├── mail/          # Email Activation & Notification Service
├── prisma/        # Database Service & Connection Pool
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

# PostgreSQL Database Connection String
DATABASE_URL="postgresql://user:password@ep-example.region.aws.neon.tech/familyroots?sslmode=require"

# JWT Authentication Secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRATION=7d

# Email Notification Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **PostgreSQL**: Database instance

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

3. **Generate Database Client:**
   ```bash
   npx prisma generate
   ```

4. **Start development server:**
   ```bash
   npm run start:dev
   ```
   Open **`http://localhost:3000/api/docs`** for interactive Swagger API documentation.

---

## 🗃️ Database Commands

```bash
# Push schema updates to database
npx prisma db push

# Generate Client
npx prisma generate

# Open Database Studio GUI
npx prisma studio

# Seed initial system data
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

Deploy the backend server to Vercel Production:

```bash
vercel --prod --yes
```

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for more information.

Developed with ❤️ by **MD Kayesur** & the FamilyRoots Team.
