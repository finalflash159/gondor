# Environment Variables

## Overview

All environment variables for Gondor Secret Management. Copy `.env.example` to `.env` and fill in values.

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/secret_manager` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3002` |
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret | `openssl rand -hex 32` |
| `AUTH_SECRET` | Must equal `NEXTAUTH_SECRET` (NextAuth v5 requirement) | `openssl rand -hex 32` |
| `MASTER_KEY` | AES-256 master key (32 bytes) | `openssl rand -hex 32` |
| `CRON_SECRET` | Protects `/api/cron/rotation` endpoint | Any string |
| `SUPER_MASTER_ADMIN` | `true` = only bootstrap admin can create orgs; `false` = any user | `false` |
| `NODE_ENV` | `development` or `production` | `development` |
| `PORT` | App port (dev only; Docker prod uses 3000) | `3002` |

## Generating Secrets

```bash
# Generate AUTH_SECRET / NEXTAUTH_SECRET (must be same value)
openssl rand -hex 32

# Generate MASTER_KEY
openssl rand -hex 32

# Generate CRON_SECRET
openssl rand -hex 32
```

## Super Master Admin

| `SUPER_MASTER_ADMIN` | Bootstrap Admin | Other Users |
|----------------------|----------------|-------------|
| `false` | Regular admin | Can create orgs freely |
| `true` | Only one who can create orgs | Must register via invite code |

## Production Checklist

- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] `NEXTAUTH_SECRET` = `AUTH_SECRET` (both must be set)
- [ ] `MASTER_KEY` generated with `openssl rand -hex 32`
- [ ] `NODE_ENV=production`
- [ ] `CRON_SECRET` set for rotation cron endpoint

## Example .env

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/secret_manager"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="super-secret-key-change-in-production-minimum-32-chars"
AUTH_SECRET="super-secret-key-change-in-production-minimum-32-chars"
MASTER_KEY="your-32-byte-master-key-here!!!"
SUPER_MASTER_ADMIN=false
CRON_SECRET="any_secret"
NODE_ENV="development"
PORT="3002"
```

## Security Notes

1. **Never commit `.env`** — it's already in `.gitignore`
2. **`MASTER_KEY` is critical** — encrypts ALL secrets. If lost, data is unrecoverable
3. **`AUTH_SECRET` = `NEXTAUTH_SECRET`** — NextAuth v5 requires both; they must match
4. **Rotate regularly** — update secrets in production periodically
