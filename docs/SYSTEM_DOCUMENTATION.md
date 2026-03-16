# Secret Management System - Technical Documentation

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Core Components](#4-core-components)
5. [API Reference](#5-api-reference)
6. [Security](#6-security)
7. [Deployment & Scaling](#7-deployment--scaling)
8. [Usage Guide](#8-usage-guide)
9. [Changelog & Bug Fixes](#9-changelog--bug-fixes)

---

## 1. System Overview

### Purpose
Secret Management System là một ứng dụng quản lý secrets (API keys, passwords, tokens, certificates) cho các teams và projects. Hệ thống này cung cấp:

- **Centralized Secret Storage**: Lưu trữ tập trung tất cả secrets
- **Environment Isolation**: Tách biệt secrets theo môi trường (dev, staging, production)
- **Access Control**: Phân quyền chi tiết theo role (Admin, Editor, Viewer)
- **Audit Logging**: Theo dõi mọi hoạt động trên hệ thống
- **Encryption**: Mã hóa secrets sử dụng AES-256-GCM

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS, Shadcn UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: NextAuth.js với JWT strategy
- **Encryption**: AES-256-GCM, bcryptjs

---

## 2. Architecture

### Project Structure
```
secret-management/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/      # Protected dashboard pages
│   │   │   ├── layout.tsx
│   │   │   ├── organizations/
│   │   │   │   ├── page.tsx              # Organizations list
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx           # Org details + projects
│   │   │   │       ├── members/           # NEW: Members management
│   │   │   │       ├── settings/          # NEW: Org settings
│   │   │   │       ├── access-control/    # NEW: Roles & permissions
│   │   │   │       ├── audit-logs/
│   │   │   │       ├── alerts/
│   │   │   │       ├── secret-rotation/   # NEW: Placeholder
│   │   │   │       ├── dynamic-secrets/    # NEW: Placeholder
│   │   │   │       └── integrations/       # NEW: Placeholder
│   │   │   │   └── organizations/[slug]/projects/[projectId]/
│   │   │   │       └── page.tsx           # Project secrets
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # Authentication APIs
│   │   │   ├── organizations/
│   │   │   │   ├── [slug]/
│   │   │   │   │   ├── route.ts           # Org CRUD
│   │   │   │   │   └── members/           # NEW: Org members API
│   │   │   │   │       ├── route.ts       # GET, POST members
│   │   │   │   │       └── [memberId]/
│   │   │   │   │           └── route.ts   # PATCH, DELETE member
│   │   │   ├── projects/    # Project APIs
│   │   │   ├── secrets/     # Secret CRUD APIs
│   │   │   └── folders/     # Folder management APIs
│   │   ├── layout.tsx
│   │   └── page.tsx         # Landing page
│   ├── components/           # Reusable UI components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── layout/         # Layout components (header, sidebar)
│   │   ├── logo.tsx        # NEW: Logo component with dark mode
│   │   ├── session-provider.tsx  # NEW: Session context
│   │   └── theme-provider.tsx    # Theme context
│   ├── lib/                # Core business logic
│   │   ├── db.ts           # Prisma client
│   │   ├── auth.ts         # NextAuth configuration (FIXED: cookies config)
│   │   ├── encryption.ts   # Encryption/decryption utilities
│   │   ├── api-auth.ts     # NEW: Auth helpers (requireOrgAccessBySlug)
│   │   ├── api-response.ts # NEW: Response helpers
│   │   ├── permissions.ts  # RBAC logic
│   │   ├── schemas/        # NEW: Zod schemas
│   │   │   ├── index.ts
│   │   │   ├── auth.schema.ts
│   │   │   ├── organization.schema.ts
│   │   │   ├── project.schema.ts
│   │   │   ├── secret.schema.ts
│   │   │   ├── folder.schema.ts
│   │   │   ├── member.schema.ts
│   │   │   ├── environment.schema.ts
│   │   │   └── common.schema.ts
│   │   ├── services/       # NEW: Service layer
│   │   │   ├── index.ts
│   │   │   ├── organization.service.ts
│   │   │   ├── project.service.ts
│   │   │   ├── secret.service.ts
│   │   │   ├── folder.service.ts
│   │   │   ├── environment.service.ts
│   │   │   ├── member.service.ts
│   │   │   ├── role.service.ts
│   │   │   └── audit.service.ts
│   │   ├── config.ts       # NEW: App config
│   │   └── utils.ts       # Utility functions
│   └── types/             # TypeScript types
│       └── index.ts
├── prisma/
│   └── schema.prisma      # Database schema
├── docker-compose.yml     # PostgreSQL setup
└── .env                  # Environment variables
```

### Authentication Flow
```
User Login
    │
    ▼
/api/auth/login (credentials)
    │
    ▼
NextAuth Credentials Provider
    │
    ├── Verify password (bcrypt)
    │
    ▼
Generate JWT token
    │
    ▼
Session stored in HTTP-only cookie
```

---

## 3. Database Schema

### Entity Relationship Diagram
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │◄─────►│  OrgMember  │◄─────►│Organization │
└─────────────┘       └─────────────┘       └──────┬──────┘
      │                                               │
      │                 ┌─────────────┐               │
      └───────────────►│   Project   │◄─────────────┘
                        └──────┬──────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌──────────────┐    ┌─────────────────┐
│    Folder     │◄──►│    Secret    │◄───►│ SecretVersion   │
│  (nested)     │    │ (encrypted)  │    │ (history)       │
└───────────────┘    └──────────────┘    └─────────────────┘
        │
        ▼
┌───────────────────┐
│ProjectEnvironment │
│ (dev/staging/prod)│
└───────────────────┘
        │
        ▼
┌───────────────┐
│ ProjectMember │◄──── Role (permissions)
└───────────────┘
```

### Models Detail

#### User
- `id`: Unique identifier (CUID)
- `email`: Unique email address
- `password`: Bcrypt hashed password
- `name`: Optional user name
- `createdAt`, `updatedAt`: Timestamps
- Relations: `memberships` (ProjectMember), `createdProjects`, `orgMemberships`, `auditLogs`, `secretVersions`

#### Organization
- `id`: Unique identifier
- `name`: Organization name
- `slug`: URL-friendly identifier (unique)
- `avatar`: Optional avatar URL
- Relations: `projects`, `members` (OrgMember)

#### Project
- `id`: Unique identifier
- `name`: Project name
- `slug`: Project identifier (unique within org)
- `orgId`: Reference to Organization
- `ownerId`: Reference to User (owner)
- Relations: `environments`, `folders`, `secrets`, `members`, `roles`

#### ProjectEnvironment
- `id`: Unique identifier
- `name`: Display name (e.g., "Development", "Production")
- `slug`: Identifier (e.g., "dev", "prod")
- `projectId`: Reference to Project
- Unique constraint: `(projectId, slug)`

#### Folder
- `id`: Unique identifier
- `name`: Folder name
- `projectId`: Reference to Project
- `envId`: Reference to ProjectEnvironment
- `parentId`: Self-reference for nested folders
- Unique constraint: `(projectId, envId, parentId, name)`

#### Secret
- `id`: Unique identifier
- `key`: Secret name (NOT encrypted for search)
- `value`: Encrypted value (AES-256-GCM)
- `folderId`, `envId`, `projectId`: References
- `createdBy`, `updatedBy`: User references
- `version`: Version number (increments on update)
- `expiresAt`: Optional expiration date
- `metadata`: JSON for tags, notes
- Unique constraint: `(projectId, envId, folderId, key)`

#### SecretVersion
- `id`: Unique identifier
- `secretId`: Reference to Secret
- `value`: Encrypted historical value
- `version`: Version number
- `createdBy`: User reference
- Purpose: Maintains version history of secrets

#### Role
- `id`: Unique identifier
- `name`: Display name (Admin, Editor, Viewer)
- `slug`: Identifier (unique within project)
- `permissions`: JSON array of permissions
- `isDefault`: Whether this is the default role for new members
- `projectId`: Reference to Project

#### ProjectMember
- `userId`, `projectId`, `roleId`: References
- Unique constraint: `(userId, projectId)`

#### OrgMember
- `userId`, `orgId`: References
- `role`: "owner" | "admin" | "member"
- Unique constraint: `(userId, orgId)`

#### AuditLog
- `id`: Unique identifier
- `projectId`, `userId`: References
- `action`: "created" | "updated" | "deleted" | "viewed" | "exported"
- `targetType`: "secret" | "folder" | "project" | "member"
- `targetId`: ID of affected entity
- `metadata`: Additional JSON data
- `ipAddress`, `userAgent`: Request info

---

## 4. Core Components

### 4.1 Authentication (`src/lib/auth.ts`)

NextAuth.js configuration with:
- **Provider**: Credentials (email/password)
- **Strategy**: JWT (not database session)
- **Session**: HTTP-only cookie

```typescript
// Key configurations
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
},

cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    },
  },
},

// Callbacks
// - jwt: Add user ID to token
// - session: Expose user ID to session
```

### 4.2 Encryption (`src/lib/encryption.ts`)

**Master Key Encryption**:
- Algorithm: AES-256-GCM
- IV: 16 bytes random
- Auth Tag: 16 bytes
- Key Derivation: SHA-256 hash of MASTER_KEY env var

**Functions**:
```typescript
// Encrypt a plaintext
encrypt(plaintext: string, key?: Buffer)
// Returns: { ciphertext, iv, tag }

// Decrypt ciphertext
decrypt(ciphertext: string, key: Buffer, iv: string, tag: string)
// Returns: plaintext

// Password hashing
hashPassword(password: string): Promise<string>
verifyPassword(password: string, hash: string): Promise<boolean>
```

**Note**: Secret values are stored as JSON string: `{"ciphertext":"...","iv":"...","tag":"..."}`

### 4.3 Permissions (`src/lib/permissions.ts`)

**Permission Types**:
| Permission | Description |
|------------|-------------|
| `secret:read` | View secrets |
| `secret:write` | Create/update secrets |
| `secret:delete` | Delete secrets |
| `folder:manage` | Create/delete folders |
| `member:manage` | Add/remove project members |
| `settings:manage` | Manage project settings |
| `project:delete` | Delete project |

**Default Roles**:
- **Admin**: All permissions
- **Editor**: secret:read, secret:write, secret:delete, folder:manage
- **Viewer**: secret:read only

**Key Functions**:
```typescript
// Get user's role in a project
getUserProjectRole(userId: string, projectId: string): Promise<Role | null>

// Check specific permission
hasPermission(userId: string, projectId: string, permission: Permission): Promise<boolean>

// Check if user is admin/owner
isProjectAdmin(userId: string, projectId: string): Promise<boolean>

// Check if user has any access to project
hasProjectAccess(userId: string, projectId: string): Promise<boolean>

// Organization-level checks
canManageOrg(userId: string, orgId: string): Promise<boolean>
isOrgOwner(userId: string, orgId: string): Promise<boolean>
```

---

## 5. API Reference

### Authentication

#### POST /api/auth/register
Register new user (requires invite code if self-registration disabled).

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "inviteCode": "ADMIN2024"  // Optional if ALLOW_SELF_REGISTRATION=true
}
```

**Response** (201):
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Organizations

#### GET /api/organizations
List all organizations the current user is a member of.

**Response** (200):
```json
[
  {
    "id": "org_id",
    "name": "My Company",
    "slug": "my-company",
    "members": [...],
    "projects": [...],
    "_count": { "projects": 5, "members": 10 }
  }
]
```

#### POST /api/organizations
Create new organization. Current user becomes owner.

**Request**:
```json
{
  "name": "New Org",
  "slug": "new-org"
}
```

#### GET /api/organizations/[slug]
Get organization details with projects and members.

#### PUT /api/organizations/[slug]
Update organization (requires admin/owner).

#### DELETE /api/organizations/[slug]
Delete organization (requires owner).

#### GET /api/organizations/[slug]/members **NEW**
List organization members.

#### POST /api/organizations/[slug]/members **NEW**
Invite a new member to the organization.

**Request**:
```json
{
  "email": "member@example.com",
  "role": "admin"  // or "member"
}
```

#### PATCH /api/organizations/[slug]/members/[memberId] **NEW**
Update member role.

#### DELETE /api/organizations/[slug]/members/[memberId] **NEW**
Remove member from organization.

### Projects

#### GET /api/projects
List projects. Optional query param: `?orgId=xxx`.

#### POST /api/projects
Create new project within an organization.

**Request**:
```json
{
  "name": "My App",
  "slug": "my-app",
  "orgId": "org_id",
  "environments": [
    { "name": "Development", "slug": "dev" },
    { "name": "Production", "slug": "prod" }
  ]
}
```

**Note**: If no environments specified, defaults to: dev, staging, prod

#### GET /api/projects/[id]
Get project details including members, roles, environments.

#### PUT /api/projects/[id]
Update project (requires admin).

#### DELETE /api/projects/[id]
Delete project (requires owner or project:delete permission).

### Secrets

#### GET /api/projects/[id]/secrets
List all secrets in a project. Query params: `?envId=xxx&folderId=xxx`.

**Note**: Secret values are decrypted before returning.

**Response** (200):
```json
[
  {
    "id": "secret_id",
    "key": "API_KEY",
    "value": "sk_live_xxx",  // Decrypted
    "envId": "env_id",
    "folderId": "folder_id",
    "version": 1,
    "expiresAt": null,
    "environment": { "id": "...", "name": "Development", "slug": "dev" }
  }
]
```

#### POST /api/projects/[id]/secrets
Create new secret.

**Request**:
```json
{
  "key": "DATABASE_URL",
  "value": "postgres://localhost:5432/db",
  "envId": "env_id",
  "folderId": "folder_id",  // Optional, defaults to root
  "expiresAt": "2024-12-31T23:59:59Z",  // Optional
  "metadata": { "tag": "production" }  // Optional
}
```

#### GET /api/secrets/[id]
Get single secret details (decrypted).

#### PUT /api/secrets/[id]
Update secret. If value changes, creates new version automatically.

**Request**:
```json
{
  "key": "NEW_KEY",
  "value": "new_value",
  "folderId": "new_folder_id",
  "expiresAt": null  // or date string to update
}
```

#### DELETE /api/secrets/[id]
Delete secret.

### Folders

#### GET /api/projects/[id]/folders
List folders. Query: `?envId=xxx`.

#### POST /api/projects/[id]/folders
Create folder.

**Request**:
```json
{
  "name": "Database",
  "envId": "env_id",
  "parentId": "parent_folder_id"  // Optional for nesting
}
```

#### DELETE /api/folders/[id]
Delete folder (and all secrets within).

### Environments

#### GET /api/projects/[id]/environments
List project environments.

#### POST /api/projects/[id]/environments
Add new environment (requires admin).

#### DELETE /api/projects/[id]/environments/[envId]
Delete environment (requires admin). **Warning**: Deletes all secrets in this environment.

### Members

#### GET /api/projects/[id]/members
List project members.

#### POST /api/projects/[id]/members
Add member to project.

**Request**:
```json
{
  "email": "user@example.com",
  "roleId": "role_id"
}
```

#### PATCH /api/projects/[id]/members/[memberId]
Update member role.

#### DELETE /api/projects/[id]/members/[memberId]
Remove member from project.

### Audit Logs

#### GET /api/projects/[id]/audit-logs
Get project audit logs. Query: `?limit=50&offset=0`.

---

## 6. Security

### 6.1 Encryption at Rest
- All secret values encrypted with AES-256-GCM
- Master key stored in environment variable (should be 32+ characters)
- Each encryption generates unique IV and auth tag
- Database stores: `{ciphertext, iv, tag}` as JSON string

### 6.2 Authentication
- Passwords hashed with bcrypt (12 rounds)
- Sessions managed via HTTP-only JWT cookies
- CSRF protection via NextAuth

### 6.3 Authorization
- Role-Based Access Control (RBAC) per project
- Owner always has full access
- Permission checks on every API endpoint

### 6.4 Audit Trail
- All CRUD operations logged
- Logs include: user, action, target, IP, user agent
- Immutable audit trail

### 6.5 Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# NextAuth
NEXTAUTH_URL="http://localhost:3002"  # FIXED: was 3000
NEXTAUTH_SECRET="super-secret-key-change-in-production-minimum-32-chars"  # FIXED: was too short

# Encryption (CRITICAL - must be 32+ characters)
MASTER_KEY="your-32-byte-master-key-here!!!"

# Registration (optional)
ALLOW_SELF_REGISTRATION=false
INVITE_CODES=ADMIN2024
```

---

## 7. Deployment & Scaling

### 7.1 Local Development

**1. Start PostgreSQL**:
```bash
docker-compose up -d
```

**2. Run Prisma migrations**:
```bash
npx prisma migrate dev
```

**3. Start development server**:
```bash
npm run dev
# Runs on http://localhost:3002
```

### 7.2 Production Deployment

**Database**:
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, Supabase)
- Enable SSL connections
- Configure connection pooling

**Application**:
```bash
# Build
npm run build

# Start production
npm start
```

**Environment**:
```bash
# Production .env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-strong-secret"
MASTER_KEY="generate-32-char-key"
ALLOW_SELF_REGISTRATION=false
```

### 7.3 Scaling Considerations

**Horizontal Scaling (Multiple Instances)**:
- Use external session store if needed (Redis)
- Sticky sessions for JWT (or share secret)
- Database connection pooling (PgBouncer)
- Load balancer with SSL termination

**Database**:
- Read replicas for read-heavy workloads
- Prisma supports read replicas configuration
- Regular backups

**Caching**:
- Add Redis for caching decrypted secrets
- Implement cache invalidation on secret updates
- Consider CDN for static assets

### 7.4 Docker Compose for Production

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=secret
      - MASTER_KEY=key
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: db

volumes:
  postgres_data:
```

---

## 8. Usage Guide

### 8.1 First Time Setup

1. **Start services**:
   ```bash
   docker-compose up -d
   ```

2. **Run migrations**:
   ```bash
   npx prisma migrate dev
   ```

3. **Create first user**:
   - Register at `/register` with invite code `ADMIN2024`
   - Or manually create user in database

4. **Create Organization**:
   - Login at `/login`
   - Click "New Organization"
   - Enter name and slug

5. **Create Project**:
   - Go to organization
   - Click "New Project"
   - Default environments: dev, staging, prod

### 8.2 Managing Secrets

1. Navigate to project
2. Select environment (dev/staging/prod)
3. Click "Add Secret"
4. Enter key and value
5. Optionally set expiration and metadata

### 8.3 Team Collaboration

1. **Add members to organization**:
   - Go to Organization > Members
   - Enter email and select role (admin/member)

2. **Add members to project**:
   - Go to Project Settings > Team
   - Enter email and select role
   - Member must already be registered

3. **Roles**:
   - Admin: Full access
   - Editor: Can manage secrets and folders
   - Viewer: Read-only access

4. **Audit logs**:
   - View all activity in Project Settings > Audit Logs

### 8.4 Best Practices

1. **Use separate environments**:
   - Never use production secrets in development
   - Use environment switching in UI

2. **Rotate secrets regularly**:
   - Set expiration dates on secrets
   - Review and rotate periodically

3. **Use folders**:
   - Group secrets by service/component
   - Use consistent naming convention

4. **Limit access**:
   - Use Viewer role for most team members
   - Only give Editor/Admin to those who need it

5. **Monitor audit logs**:
   - Regular review of who accessed what
   - Set up alerts for suspicious activity

---

## 9. Changelog & Bug Fixes

### Bugs Fixed

#### 1. React Router Push During Render
- **Issue**: `DashboardLayout` was calling `router.push('/login')` during render
- **Error**: "Cannot update a component (Router) while rendering a different component"
- **Fix**: Changed to use `useEffect` for redirect
- **File**: `src/app/(dashboard)/layout.tsx`

#### 2. Login Not Working
- **Issue**: Session cookie not being set properly
- **Root Cause**:
  1. NEXTAUTH_URL was set to port 3000 instead of 3002
  2. NEXTAUTH_SECRET was too short (< 32 characters)
  3. Missing cookie configuration in auth.ts
- **Fix**:
  1. Updated `.env` to use port 3002
  2. Updated `NEXTAUTH_SECRET` to 32+ characters
  3. Added explicit cookie configuration in `src/lib/auth.ts`
- **File**: `.env`, `src/lib/auth.ts`

#### 3. Organizations API 500 Error
- **Issue**: API returned 500 when user not authenticated
- **Root Cause**: `handleAuthError` function was checking for `Error` instance but throwing plain object `{ status, message }`
- **Fix**: Updated error handling to check for object with `message` property
- **File**: `src/app/api/organizations/route.ts`

#### 4. Organization "Not Found" Error
- **Issue**: After login, navigating to `/organizations/[slug]` showed "Organization not found"
- **Root Cause**: Database was empty (no organizations existed)
- **Fix**: Created organization via API for test user
- **Resolution**: User now has "My Organization" with slug "my-org"

#### 5. Logo Dark Mode
- **Issue**: Logo showed black on dark background in dark mode
- **Fix**: Created Logo component with `dark:invert` CSS class
- **Files**: `src/components/logo.tsx` (NEW), updated login/register pages

#### 6. Missing next-themes Package
- **Issue**: Logo component failed because `next-themes` wasn't installed
- **Fix**: Installed `next-themes` package
- **Command**: `npm install next-themes`

### New Features Implemented

#### 1. Members Management (Organization Level)
- **API**: `GET/POST /api/organizations/[slug]/members`
- **API**: `PATCH/DELETE /api/organizations/[slug]/members/[memberId]`
- **Frontend**: `/organizations/[slug]/members` page now fetches from API
- **Features**: Invite member, remove member, view all members
- **Files**:
  - `src/app/api/organizations/[slug]/members/route.ts` (NEW)
  - `src/app/api/organizations/[slug]/members/[memberId]/route.ts` (NEW)
  - `src/app/(dashboard)/organizations/[slug]/members/page.tsx` (UPDATED)

#### 2. Settings Page
- **Frontend**: `/organizations/[slug]/settings` now has organization name edit form
- **Features**: Edit organization name
- **File**: `src/app/(dashboard)/organizations/[slug]/settings/page.tsx` (UPDATED)

#### 3. Access Control Page
- **Frontend**: `/organizations/[slug]/access-control` now fetches from API
- **Features**: Display roles per project, permissions reference
- **File**: `src/app/(dashboard)/organizations/[slug]/access-control/page.tsx` (UPDATED)

#### 4. New Auth Helper
- **Function**: `requireOrgAccessBySlug(slug, role?)`
- **Purpose**: Allows authentication by organization slug instead of requiring ID first
- **File**: `src/lib/api-auth.ts`

#### 5. Logo Component
- **Component**: `Logo` with dark mode support using `dark:invert` CSS
- **Usage**: Used in login, register pages, sidebar
- **File**: `src/components/logo.tsx` (NEW)

### Placeholder Pages (Coming Soon)

The following pages have placeholder UI indicating they're under development:
- **Secret Rotation**: `/organizations/[slug]/secret-rotation`
- **Dynamic Secrets**: `/organizations/[slug]/dynamic-secrets`
- **Integrations**: `/organizations/[slug]/integrations`
- **Billing**: `/organizations/[slug]/billing`
- **Alerts**: `/organizations/[slug]/alerts`

### Backend Refactoring (Previously Completed)

These were done before this session but are noted for completeness:

1. **Service Layer** - Business logic separated into services:
   - `src/lib/services/organization.service.ts`
   - `src/lib/services/project.service.ts`
   - `src/lib/services/secret.service.ts`
   - `src/lib/services/folder.service.ts`
   - `src/lib/services/environment.service.ts`
   - `src/lib/services/member.service.ts`
   - `src/lib/services/audit.service.ts`

2. **Zod Schemas** - Centralized validation:
   - `src/lib/schemas/index.ts`
   - `src/lib/schemas/auth.schema.ts`
   - `src/lib/schemas/organization.schema.ts`
   - `src/lib/schemas/project.schema.ts`
   - `src/lib/schemas/secret.schema.ts`
   - `src/lib/schemas/folder.schema.ts`
   - `src/lib/schemas/member.schema.ts`
   - `src/lib/schemas/environment.schema.ts`
   - `src/lib/schemas/common.schema.ts`

3. **API Response Helpers**:
   - `src/lib/api-response.ts` (success, error, unauthorized, etc.)

4. **Auth Middleware**:
   - `src/lib/api-auth.ts` (requireAuth, requireProjectAccess, requireOrgAccess)

### Known Issues / TODO

1. **Invite Codes**: Currently stored in env var, should be in database
2. **Password Reset**: Not implemented
3. **Email Verification**: Not implemented
4. **2FA**: Not implemented
5. **OAuth Providers**: Not implemented (only credentials)
6. **Rate Limiting**: Not implemented
7. **Session Revocation UI**: Not implemented
8. **Audit Logging for Auth Events**: Not implemented

---

## Appendix: API Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register user |
| `/api/auth/[...nextauth]` | * | NextAuth handlers |
| `/api/auth/session` | GET | Get current session |
| `/api/organizations` | GET, POST | List/Create orgs |
| `/api/organizations/[slug]` | GET, PUT, DELETE | Org operations |
| `/api/organizations/[slug]/members` | GET, POST | **NEW** Org members |
| `/api/organizations/[slug]/members/[memberId]` | PATCH, DELETE | **NEW** Manage member |
| `/api/projects` | GET, POST | List/Create projects |
| `/api/projects/[id]` | GET, PUT, DELETE | Project operations |
| `/api/projects/[id]/secrets` | GET, POST | Secrets CRUD |
| `/api/projects/[id]/folders` | GET, POST | Folder management |
| `/api/projects/[id]/environments` | GET, POST, DELETE | Environment mgmt |
| `/api/projects/[id]/members` | GET, POST | Member management |
| `/api/projects/[id]/roles` | GET | List roles |
| `/api/projects/[id]/audit-logs` | GET | View audit logs |
| `/api/secrets/[id]` | GET, PUT, DELETE | Single secret |

---

*Document generated on 2026-03-15*
*Last updated: 2026-03-15*
