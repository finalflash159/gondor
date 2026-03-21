# Gondor — Secret Management

A modern, secure secret management application for teams and organizations. Store, organize, and manage sensitive credentials with enterprise-grade encryption.

## Features

### Secret Management
- **AES-256-GCM Encryption**: All secrets encrypted at rest
- **Multi-Environment**: Separate dev, staging, production environments
- **Folder Organization**: Hierarchical folder structure
- **Version History**: Full audit trail of secret changes
- **Secret Expiry**: Set expiration dates with alert notifications

### Team Collaboration
- **Two-Level RBAC**: Org-level (owner/admin/member) + project-level (custom roles)
- **Invite Codes**: Secure team onboarding via org invitation codes
- **Audit Logging**: Complete activity history per project
- **Member Autocomplete**: Fast member search when adding to projects

### Integrations
- **Dynamic Secrets**: Auto-rotating database credentials (PostgreSQL, MySQL, MongoDB, Redis)
- **Scheduled Rotation**: Cron-based credential rotation
- **External Integrations**: AWS, Azure, GitHub, Slack (encrypted config at rest)

### Security
- **Organization Isolation**: Complete data separation between tenants
- **Rate Limiting**: Sliding window limits on auth endpoints
- **JWT Sessions**: NextAuth v5 with httpOnly session cookies

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth v5 (credentials + JWT) |
| Encryption | AES-256-GCM |
| Styling | Tailwind CSS + next-themes |
| State | React Query (partial) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)

### 1. Clone & Install

```bash
git clone <repo-url>
cd gondor
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, NEXTAUTH_SECRET, AUTH_SECRET, MASTER_KEY
```

Required variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/secret_manager"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="same-as-AUTH_SECRET-min-32-chars"
AUTH_SECRET="same-as-NEXTAUTH_SECRET-min-32-chars"
MASTER_KEY="32-byte-hex-key-openssl-rand-hex-32"
SUPER_MASTER_ADMIN=false
CRON_SECRET="any-secret-string"
```

> **Important**: `AUTH_SECRET` must equal `NEXTAUTH_SECRET` (NextAuth v5 requirement).

### 3. Database Setup

```bash
# Option A: Docker (recommended for dev)
docker compose -f docker-compose.dev.yml up -d
npx prisma db push
npx prisma generate

# Option B: Local Postgres
npx prisma db push
npx prisma generate
```

### 4. Create First Admin

```bash
npm run bootstrap -- --email admin@gondor.dev --password "Admin123456!" --name "Admin"
```

### 5. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) and login with `admin@gondor.dev` / `Admin123456!`.

---

## Docker Production

```bash
# Full reset + setup (one command)
docker compose -f docker-compose.prod.yml down -v && \
docker compose -f docker-compose.prod.yml build --no-cache && \
docker compose -f docker-compose.prod.yml up -d && \
sleep 5 && \
docker compose -f docker-compose.prod.yml exec app npm run bootstrap -- \
  --email admin@gondor.dev --password "Admin123456!" --name "Admin"
```

App runs at [http://localhost:3000](http://localhost:3000).

See `setup.md` for detailed Docker setup instructions.

---

## Bootstrap CLI

```bash
# Interactive
npm run bootstrap

# Non-interactive
npm run bootstrap -- --email admin@example.com --password "Secret123!" --name "Admin"

# Help
npm run bootstrap -- --help
```

| Flag | Description |
|------|-------------|
| `--email` | Admin email (required non-interactive) |
| `--password` | Password, min 8 chars (required non-interactive) |
| `--name` | Display name |
| `--help` | Show help |

**Behavior:**
- Exits silently if users already exist
- Password hashed with bcrypt cost 12
- `isMasterAdmin=true` on the created user

**`SUPER_MASTER_ADMIN=true`**: Only the bootstrap admin can create organizations. All other users must register via org invite codes.

**`SUPER_MASTER_ADMIN=false`**: Any authenticated user can create organizations.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # /login, /register
│   ├── (dashboard)/      # Protected pages
│   │   └── organizations/[slug]/
│   │       ├── page.tsx                 # Org overview + projects
│   │       ├── projects/[projectId]/
│   │       │   ├── page.tsx             # Secrets, envs, team
│   │       │   └── members/page.tsx
│   │       ├── access-control/           # Project RBAC
│   │       ├── alerts/
│   │       ├── audit-logs/
│   │       ├── dynamic-secrets/
│   │       ├── folders/
│   │       ├── integrations/
│   │       ├── invitations/
│   │       ├── members/
│   │       ├── secret-rotation/
│   │       └── settings/
│   └── api/              # 40+ API routes
├── backend/
│   ├── services/         # 13 services (secret, project, org, etc.)
│   ├── middleware/       # auth, permissions, rate-limit
│   └── schemas/          # Zod validation
├── components/           # UI + layout components
├── hooks/                # React Query hooks
└── lib/                  # auth, encryption, db, query-provider
```

---

## API Overview

All API routes (except auth) require an authenticated session cookie.

### Response Format

```typescript
// Success
{ success: true, data: { ... } }

// Error
{ error: "message", success: false }
```

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth handler |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/register` | Register with invite code (rate-limited 3/min) |

### Projects

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/[id]` | Get project |
| PATCH | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |
| GET | `/api/projects/[id]/secrets` | List secrets |
| POST | `/api/projects/[id]/secrets` | Create/update secrets |
| GET | `/api/projects/[id]/members/search` | Search org members for autocomplete |
| GET | `/api/projects/[id]/roles` | List project roles |
| POST | `/api/projects/[id]/roles` | Create role |
| DELETE | `/api/projects/[id]/roles/[roleId]` | Delete role |

### Organizations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/organizations` | List user's orgs |
| POST | `/api/organizations` | Create org |
| GET | `/api/organizations/[slug]` | Get org + projects |
| PATCH | `/api/organizations/[slug]` | Update org |
| GET | `/api/organizations/[slug]/members` | List org members |
| POST | `/api/organizations/[slug]/invitations` | Create invite code |
| DELETE | `/api/organizations/[slug]/invitations/[id]` | Revoke invite |
| POST | `/api/organizations/[slug]/invitations/[id]/regenerate` | Regenerate code |

### Dynamic Secrets

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/[id]/dynamic-secrets` | List dynamic secrets |
| POST | `/api/projects/[id]/dynamic-secrets` | Create dynamic secret |
| DELETE | `/api/projects/[id]/dynamic-secrets/[id]` | Delete |
| GET | `/api/projects/[id]/rotation-jobs` | List rotation jobs |
| POST | `/api/projects/[id]/rotation-jobs` | Create rotation job |
| PATCH | `/api/projects/[id]/rotation-jobs/[id]` | Update job |
| DELETE | `/api/projects/[id]/rotation-jobs/[id]` | Delete job |

### Cron

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/cron/rotation` | Trigger secret rotation (protected by `CRON_SECRET`) |

---

## License

MIT
