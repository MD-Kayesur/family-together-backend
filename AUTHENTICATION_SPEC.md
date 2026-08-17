# FamilyRoots / Kinora — Authentication, Session & Resource Authorization Specification

## 1. Executive Summary & Architecture Overview

The **FamilyRoots / Kinora** platform requires a multi-layered security system that goes beyond simple JWT checking. Because FamilyRoots stores sensitive multi-generational family networks, personal archives, and lineage records, the authentication system is designed as a **Stateful Session & Rotating JWT Architecture** coupled with **Resource-Level Authorization**.

```
                    ┌──────────────────┐
                    │    Next.js Web   │
                    └────────┬─────────┘
                             │
                             │ HTTPS (HttpOnly Cookies)
                             ▼
                    ┌──────────────────┐
                    │   NestJS API     │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        Auth Module    User Module     Resource Modules
              │                        (Family Tree, Members, Memories)
      ┌───────┼────────┐
      │       │        │
      ▼       ▼        ▼
   Access   Refresh   Session
    JWT      Token     Manager
  (10-15m)  Rotation   (Database)
      │       │        │
      └───────┼────────┘
              │
              ▼
           Prisma
              │
              ▼
         PostgreSQL
```

---

## 2. Core Security Pillars

1. **Short-Lived Access Tokens**: Access JWTs expire in **10–15 minutes** to minimize damage if intercepted.
2. **Session-Backed Refresh Tokens**: Refresh tokens are stored as **SHA-256 hashes** in the database, bound to active sessions (`userAgent`, `ipAddress`, `lastUsedAt`).
3. **Refresh Token Rotation & Reuse Detection**:
   * Every refresh request invalidates the previous refresh token and issues a new pair.
   * If a previously revoked refresh token is presented (potential token theft), the entire session family is immediately revoked, forcing all devices to re-authenticate.
4. **Multi-Device Session Management**: Users can view all active devices/sessions and remotely revoke individual sessions (`Logout Device`) or all sessions (`Logout All Devices`).
5. **Resource-Level Authorization**: Permission checks go beyond global roles to evaluate whether a user owns or is granted access to a specific family node, photo memory, or document vault.

---

## 3. Database Schema Specification (`prisma/schema.prisma`)

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  USER
}

enum UserStatus {
  ACTIVE
  PENDING
  SUSPENDED
}

model User {
  id                String                   @id @default(uuid())
  email             String                   @unique
  fullName          String
  passwordHash      String
  avatarUrl         String?
  phoneNumber       String?
  bio               String?
  role              Role                     @default(USER)
  status            UserStatus               @default(PENDING)
  emailVerifiedAt   DateTime?
  createdAt         DateTime                 @default(now())
  updatedAt         DateTime                 @updatedAt

  sessions          Session[]
  resetTokens       PasswordResetToken[]
  verifyTokens      EmailVerificationToken[]

  @@map("users")
}

model Session {
  id               String    @id @default(uuid())
  userId           String
  refreshTokenHash String    @unique
  userAgent        String?
  ipAddress        String?
  expiresAt        DateTime
  revokedAt        DateTime?
  lastUsedAt       DateTime  @default(now())
  createdAt        DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("password_reset_tokens")
}

model EmailVerificationToken {
  id         String    @id @default(uuid())
  userId     String
  tokenHash  String    @unique
  expiresAt  DateTime
  verifiedAt DateTime?
  createdAt  DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("email_verification_tokens")
}
```

---

## 4. Endpoints & Flow Specifications

### 4.1 Signup Flow (`POST /auth/signup`)
```
POST /auth/signup ──► Validate Payload ──► Check Existing Email ──► Hash Password (bcrypt 12)
                          │
                          ▼
                Create User (PENDING) ──► Generate Verification Token Hash ──► Send Email ──► Response
```

### 4.2 Signin Flow (`POST /auth/signin`)
```
POST /auth/signin ──► Validate Credentials ──► Check Account Status ──► Check Email Verification
                          │
                          ▼
                Create Database Session ──► Issue Access JWT (15 min) + Refresh Token
                          │
                          ▼
             Store Refresh Token HASH in DB ──► Set HttpOnly Cookies (access_token, refresh_token)
```

### 4.3 Token Refresh & Rotation (`POST /auth/refresh`)
```
POST /auth/refresh ──► Read Cookie ──► Validate Token & Hash ──► Check Session Active?
                          │                                           │
                        [YES]                                       [NO / Reused]
                          │                                           │
        Rotate Token (Revoke Old, Issue New)                  Revoke Session Family & Force Login
                          │
                Set New HttpOnly Cookies
```

### 4.4 Logout Operations
* `POST /auth/logout`: Revokes the current session record (`revokedAt = now()`) and clears cookies.
* `POST /auth/logout-all`: Revokes all active sessions for the authenticated user across all devices.

### 4.5 Password & Verification System
* `POST /auth/forgot-password`: Generates one-time reset token link sent via email.
* `POST /auth/reset-password`: Verifies token, sets new password hash, and **revokes all existing sessions** for safety.
* `POST /auth/change-password`: Authenticated password change that optionally revokes other active sessions.
* `POST /auth/verify-email`: Verifies token and sets `emailVerifiedAt = now()`, updating status to `ACTIVE`.
* `POST /auth/resend-verification`: Resends activation email.

---

## 5. Three-Tier Authorization Strategy

Security checks follow a mandatory 3-tier cascade before any business logic executes:

```
┌─────────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION (JwtAuthGuard)                        │
│    Who are you? (Validates Access JWT & active Session) │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 2. ROLE AUTHORIZATION (RolesGuard)                      │
│    What global role do you have? (SUPER_ADMIN, USER)    │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 3. RESOURCE AUTHORIZATION (PermissionsGuard)            │
│    Can you access THIS specific family/person/memory?   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ 4. BUSINESS LOGIC EXECUTION                             │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Final Module Architecture (`src/auth/`)

```
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── signup.dto.ts
│   ├── signin.dto.ts
│   ├── refresh-token.dto.ts
│   ├── change-password.dto.ts
│   ├── reset-password.dto.ts
│   ├── verify-email.dto.ts
│   └── resend-verification.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── permissions.guard.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── refresh-token.strategy.ts
├── decorators/
│   ├── current-user.decorator.ts
│   ├── roles.decorator.ts
│   └── permissions.decorator.ts
├── services/
│   ├── token.service.ts
│   ├── session.service.ts
│   ├── password.service.ts
│   └── verification.service.ts
└── types/
    └── auth.types.ts
```

---

## 7. 18-Phase Implementation Roadmap

* **PHASE 01**: Environment & Dependencies (`@nestjs/jwt`, `passport`, `bcryptjs`, `cookie-parser`) ✅ *(Completed)*
* **PHASE 02**: User + Session Prisma Schema (`schema.prisma` updates & migrations)
* **PHASE 03**: Auth Module Scaffolding
* **PHASE 04**: Password Hashing Service (`bcryptjs` wrapper)
* **PHASE 05**: Signup Logic & DTO Validation
* **PHASE 06**: Login & Credential Verification
* **PHASE 07**: Short-lived Access JWT Issue
* **PHASE 08**: Refresh Token Generation, Session Storage & Rotation Logic
* **PHASE 09**: HttpOnly Cookie Security Setup (`SameSite=Lax`, `Secure`, `HttpOnly`)
* **PHASE 10**: `JwtAuthGuard` + `JwtStrategy` Configuration
* **PHASE 11**: Custom `@CurrentUser()` Decorator
* **PHASE 12**: Global Roles Guard (`RolesGuard`) & Resource Permission Guard (`PermissionsGuard`)
* **PHASE 13**: Logout Endpoint & Session Revocation (`/auth/logout`, `/auth/logout-all`)
* **PHASE 14**: Email Verification Token Flow (`/auth/verify-email`)
* **PHASE 15**: Password Reset & Password Change Endpoints
* **PHASE 16**: Security Hardening (Rate-limiting, CORS, Header Security)
* **PHASE 17**: Auth Unit Tests
* **PHASE 18**: Integration & E2E Tests
