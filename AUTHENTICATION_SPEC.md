# FamilyRoots Backend — Authentication & Security Specification

## 1. Executive Summary
This document specifies the technical design, security architecture, and database models for the complete authentication system in the **FamilyRoots Backend** (`family-together-backend`).

The system uses a **NestJS Native JWT + Passport** architecture with **HTTP-Only Cookies**, **Prisma ORM 7**, and **Role-Based Access Control (RBAC)** to ensure privacy-first security for multi-generational family tree data.

---

## 2. Recommended Tech Stack
* **Framework**: NestJS (v11)
* **ORM**: Prisma ORM (v7.9) with PostgreSQL
* **Authentication Engine**: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
* **Password Hashing**: `bcryptjs` (12 salt rounds)
* **Token Storage**: HTTP-Only, SameSite, Secure Cookies
* **Validation**: `class-validator`, `class-transformer`

---

## 3. Database Schema Specification (`prisma/schema.prisma`)

```prisma
enum Role {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum UserStatus {
  ACTIVE
  PENDING
  SUSPENDED
}

model User {
  id            String     @id @default(uuid())
  email         String     @unique
  fullName      String
  password      String?
  avatarUrl     String?
  phoneNumber   String?
  bio           String?
  role          Role       @default(MEMBER)
  status        UserStatus @default(ACTIVE)
  emailVerified Boolean    @default(false)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  sessions      Session[]

  @@map("users")
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  refreshToken String   @unique
  userAgent    String?
  ipAddress    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

---

## 4. API Endpoints Specification

### 4.1 Sign Up
* **Endpoint**: `POST /auth/signup`
* **Access**: Public
* **Payload (`SignUpDto`)**:
  ```typescript
  export class SignUpDto {
    email: string;      // Valid email format
    fullName: string;   // Min length 2
    password: string;   // Min length 8, strong password rule
  }
  ```
* **Response (`201 Created`)**: Returns created user profile (excluding password hash).

---

### 4.2 Sign In
* **Endpoint**: `POST /auth/signin`
* **Access**: Public
* **Payload (`SignInDto`)**:
  ```typescript
  export class SignInDto {
    email: string;
    password: string;
  }
  ```
* **Behavior**:
  1. Validates email & password against stored hash using `bcrypt.compare`.
  2. Generates short-lived Access JWT (15 min) and long-lived Refresh Token (7 days).
  3. Saves refresh session in `Session` table.
  4. Sets `access_token` and `refresh_token` in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
* **Response (`200 OK`)**: User profile payload.

---

### 4.3 Refresh Token
* **Endpoint**: `POST /auth/refresh`
* **Access**: Public (requires valid refresh cookie)
* **Behavior**: Rotates refresh token and returns new Access JWT.

---

### 4.4 Logout
* **Endpoint**: `POST /auth/logout`
* **Access**: Protected (`JwtAuthGuard`)
* **Behavior**: Clears HTTP-only cookies and deletes session record from database.

---

### 4.5 Current User Profile (`Me`)
* **Endpoint**: `GET /auth/me`
* **Access**: Protected (`JwtAuthGuard`)
* **Response**: Returns authenticated user profile.

---

## 5. Security & Permission Architecture

### 5.1 NestJS Guards & Decorators

1. **`JwtAuthGuard`**:
   - Extracts JWT from HTTP-only cookie or `Authorization: Bearer <token>` header.
   - Verifies JWT signature and attaches `req.user`.

2. **`RolesGuard` & `@Roles(...)` Decorator**:
   - Enforces Role-Based Access Control.
   - Example usage on routes:
     ```typescript
     @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles(Role.ADMIN, Role.OWNER)
     @Get('/admin/users')
     getUsers() { ... }
     ```

3. **`@CurrentUser()` Parameter Decorator**:
   - Injects authenticated `User` object directly into controller route handlers:
     ```typescript
     @Get('profile')
     getProfile(@CurrentUser() user: User) {
       return user;
     }
     ```

---

## 6. Implementation Roadmap

1. **Phase 1: Dependencies**: Install `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcryptjs`, `cookie-parser`.
2. **Phase 2: Database Schema**: Apply `Session` model update to `prisma/schema.prisma`.
3. **Phase 3: Auth Module Setup**: Create `AuthModule`, `AuthService`, `AuthController`.
4. **Phase 4: Guards & Strategies**: Implement `JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, `@CurrentUser` decorator.
5. **Phase 5: DTOs & Validation**: Add `SignUpDto`, `SignInDto` with `class-validator` rules.
6. **Phase 6: End-to-End Verification**: Run unit and integration tests for authentication endpoints.
