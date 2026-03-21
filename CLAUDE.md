# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gondor** — Secret Management. A Next.js 14 application for managing secrets/environment variables with AES-256-GCM encryption, two-level RBAC (org + project), and multi-tenant architecture.

## Commands

```bash
# Development (runs on port 3002)
npm run dev

# Build & Start
npm run build
npm run start        # Production server

# Lint
npm run lint

# Bootstrap first admin (run once after DB is ready)
npm run bootstrap              # Interactive prompts
npm run bootstrap -- --help    # CLI options

# Prisma
npx prisma migrate dev --name <name>  # Create migration
npx prisma db push                    # Push schema (prototyping)
npx prisma generate                   # Generate Prisma client
npx prisma studio                     # Open DB GUI
```

## Tech Stack

- **Next.js 14.2** (App Router), **React 18**, **TypeScript**
- **PostgreSQL** via **Prisma ORM**
- **NextAuth v5 beta** (`next-auth@5.0.0-beta.30`) — credentials login, JWT strategy, session cookie
- **AES-256-GCM** encryption via `src/lib/encryption.ts`
- **@tanstack/react-query** v5 — data fetching (partial adoption, see Hooks section)
- **Zod v4** — request validation
- **bcryptjs** — password hashing (cost factor 12)
- **Tailwind CSS** + **next-themes** — styling + dark mode
- **Lucide React** — icons

---

## Architecture

### Request Flow

```
Browser → API Route → Middleware (auth, rate-limit) → Service Layer → Prisma → PostgreSQL
```

### Folder Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/               # /login, /register
│   ├── (dashboard)/          # Protected pages (org, project, settings, etc.)
│   │   └── organizations/[slug]/
│   │       ├── page.tsx      # Org overview + projects list
│   │       ├── projects/[projectId]/
│   │       │   ├── page.tsx  # Project secrets, environments, team
│   │       │   └── members/page.tsx
│   │       ├── access-control/   # Project RBAC
│   │       ├── alerts/
│   │       ├── audit-logs/
│   │       ├── billing/
│   │       ├── dynamic-secrets/
│   │       ├── folders/
│   │       ├── integrations/
│   │       ├── invitations/
│   │       ├── members/          # Org members
│   │       ├── secret-rotation/
│   │       └── settings/          # Org settings
│   └── api/                   # API routes (see API section)
├── backend/
│   ├── services/             # 13 service files (business logic)
│   ├── middleware/
│   │   ├── auth.ts           # Auth + RBAC middleware
│   │   ├── permissions.ts    # Permission helpers
│   │   └── rate-limit.ts     # In-memory sliding window rate limiter
│   ├── schemas/              # Zod validation schemas
│   └── utils/
│       └── api-response.ts   # success(), error(), unauthorized(), etc.
├── components/
│   ├── ui/                  # Base UI (button, modal, card, input, badge, combobox, etc.)
│   ├── layout/               # sidebar, header
│   └── ...
├── hooks/                    # React hooks (React Query based — partial adoption)
│   ├── useOrganization.ts
│   ├── useProjects.ts
│   └── useSecrets.ts
└── lib/
    ├── auth.ts              # NextAuth config
    ├── encryption.ts         # AES-256-GCM + bcrypt
    ├── db.ts                # Prisma client singleton
    └── query-provider.tsx   # React Query provider
```

### API Route Conventions

All routes:
- Use `requireAuth()` / `requireProjectAccess()` / `requireOrgAccess()` middleware
- Return `{ success, data, message }` via helpers in `@backend/utils/api-response`
- Validate input with Zod schemas in `@backend/schemas`
- Delegate business logic to service layer in `@backend/services`

### Middleware Pattern (Project Access)

```typescript
// Correct signature — handler receives ONE argument: auth object
export const GET = withProjectAccess()(async (auth) => {
  const { projectId, user, isOwner } = auth;
  // ...
});
```

Common middleware exports from `@backend/middleware/auth`:
- `requireAuth()` → `{ user }` or throws 401
- `requireOrgAccess(orgId, role?)` → `{ ...user, orgId, isOwner }` or throws
- `requireOrgOwner(orgId)` → same, requires 'owner' role
- `requireProjectAccess(projectId, permission?)` → `{ user, projectId, isOwner }` or throws
- `withProjectAccess(permission?)` → HOC wrapper for route handlers

### Data Fetching

React Query is installed and used in `src/hooks/`. However, many pages still use raw `useEffect`/`useState` + `fetch`. When adding new data fetching, prefer React Query hooks.

```typescript
// src/lib/query-provider.tsx — QueryClient config
staleTime: 60s, gcTime: 5min, retry: 1, refetchOnWindowFocus: true
```

### Encryption

`src/lib/encryption.ts` provides:
- `encrypt(plaintext, key)` / `decrypt(...)` — AES-256-GCM
- `encryptJson(obj, key)` / `decryptJson<T>(str, key)` — JSON objects
- `hashPassword(password)` / `verifyPassword(password, hash)` — bcrypt cost 12
- `getMasterKey()` — reads `MASTER_KEY` env, SHA-256 hashes to 32 bytes
- `deriveKey(password, salt)` — PBKDF2-SHA256, 100k iterations

Secrets stored in DB are encrypted with `encryptJson`. DynamicSecret config and Integration config are also encrypted at rest.

---

## Registration & Bootstrap

### Bootstrap (first-time setup only)

Run `npm run bootstrap` after DB is ready. Creates the first user as `isMasterAdmin=true`.

```bash
npm run bootstrap -- --email admin@example.com --password "Secret123!" --name "Admin"
```

### Registration (normal users)

All users must register via an **organization invite code**. No open registration.

```typescript
// src/app/api/auth/register/route.ts
// POST /api/auth/register { email, password, name?, inviteCode }
// Rate-limited: 3 req/min per IP
```

### SUPER_MASTER_ADMIN Behavior

| Env Var | Bootstrap Admin | Other Users |
|---------|----------------|-------------|
| `false` | Regular admin | Can create orgs freely |
| `true` | Org creator only | Must use invite codes |

---

## RBAC — Two-Level Model

### Org-Level Roles (`OrgMember.role`)

| Role | Description |
|------|-------------|
| `owner` | Full org control, can delete org |
| `admin` | Manage org members and projects |
| `member` | View org, create projects if permitted |

### Project-Level Roles (custom, stored in `Role` table)

Default roles created per project:

| Role | Permissions |
|------|-------------|
| `admin` | secret:read, secret:write, secret:delete, folder:manage, member:manage, settings:manage |
| `developer` | secret:read, secret:write, folder:manage |
| `viewer` | secret:read |

### Permission Types

```typescript
type Permission =
  | 'secret:read'      // View secret values
  | 'secret:write'     // Create/update secrets
  | 'secret:delete'    // Delete secrets
  | 'folder:manage'    // Create/delete folders
  | 'member:manage'    // Add/remove project members
  | 'settings:manage'  // Update project settings
  | 'project:delete'   // Delete project
```

### Key RBAC Rules

- Project **owner** always has full access (checked via `Project.ownerId`)
- Project **member** checked via `ProjectMember` + `Role`
- Org access checked via `OrgMember`
- Member pages show "Access Restricted" (not "Access Denied")
- `withProjectAccess()` passes `{ user, projectId, isOwner }` — NOT `(req, params)` signature

---

## Rate Limiting

`src/backend/middleware/rate-limit.ts` — in-memory sliding window, no Redis needed.

| Limiter | Window | Max |
|---------|--------|-----|
| `loginRateLimiter` | 60s | 5 req/IP |
| `registerRateLimiter` | 60s | 3 req/IP |
| `apiRateLimiter` | 60s | 100 req/IP |

Used in: `POST /api/auth/register`, `POST /api/auth/[...nextauth]`

---

## Database

PostgreSQL via Prisma. Schema: `prisma/schema.prisma`.

### Key Models

```
User
Organization ──has many── Project ──has many── Secret (encrypted)
  │                        │                      │
  └── OrgMember            ├── ProjectEnvironment │
  └── OrgInvitation        ├── Folder             └── SecretVersion
                          ├── Role
                          ├── ProjectMember
                          ├── AuditLog
                          └── Alert

DynamicSecret (encrypted config)
  ├── RotationJob
  ├── DynamicSecretCredential
  └── RotationLog

Integration (encrypted config)
  └── IntegrationSync
```

### Indexes

15 indexes on high-traffic patterns: Secret (projectId, envId, expiresAt), AuditLog (projectId, targetId), Folder (projectId, envId), DynamicSecret (projectId, envId), RotationJob (isActive, nextRunAt), Project (orgId), ProjectMember (projectId, userId), Role (projectId), SecretVersion (secretId), IntegrationSync (integrationId), InvitationUse (invitationId).

---

## Environment Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3002"        # dev: 3002, prod: 3000
NEXTAUTH_SECRET="..."                        # must match AUTH_SECRET
AUTH_SECRET="..."                            # NextAuth v5 requires both
MASTER_KEY="..."                             # 32 bytes, openssl rand -hex 32
SUPER_MASTER_ADMIN=false                     # true = invite-only org creation
CRON_SECRET="..."                            # protects /api/cron/rotation
NODE_ENV="development"
PORT="3002"                                  # dev only
```

> **Critical**: `AUTH_SECRET` must equal `NEXTAUTH_SECRET` for NextAuth v5 to work.

---

## Ports

| Environment | Port | Notes |
|-------------|------|-------|
| Local dev (`npm run dev`) | **3002** | Uses localhost Postgres |
| Docker prod | **3000** | Postgres internal (5432), not exposed |
| Docker dev compose | **3002** | Postgres exposed on 5432 |

Docker prod: `docker compose -f docker-compose.prod.yml up -d`
Docker dev: `docker compose -f docker-compose.dev.yml up -d`
