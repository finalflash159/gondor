# Local Setup Guide

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| PostgreSQL | 14+ (or Docker) |
| npm | 9+ |

## Step 1: Clone & Install

```bash
git clone <repo-url>
cd gondor
npm install
```

## Step 2: Environment Variables

```bash
cp .env.example .env
# Edit .env with your values
```

Required variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/secret_manager"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="super-secret-key-change-in-production-minimum-32-chars"
AUTH_SECRET="super-secret-key-change-in-production-minimum-32-chars"
MASTER_KEY="your-32-byte-master-key-here!!!"
SUPER_MASTER_ADMIN=false
CRON_SECRET="any_secret"
```

Generate secrets:
```bash
openssl rand -hex 32
```

## Step 3: Database Setup

### Option A: Docker Postgres (recommended)

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Option B: Local Postgres

Create database:
```bash
createdb secret_manager
```

Then initialize:
```bash
npx prisma db push
npx prisma generate
```

## Step 4: Start Dev Server

```bash
npm run dev
```

App starts at `http://localhost:3002`

## Step 5: Bootstrap First Admin

```bash
npm run bootstrap -- --email admin@gondor.dev --password "Admin123456!" --name "Admin"
```

Login at `http://localhost:3002` with `admin@gondor.dev` / `Admin123456!`

## Common Issues

### "Database connection refused"
- PostgreSQL is not running
- Check `DATABASE_URL` is correct

### "AUTH_SECRET / NEXTAUTH_SECRET mismatch"
- Both must be set to the **same value**
- NextAuth v5 requires `AUTH_SECRET` in addition to `NEXTAUTH_SECRET`

### "Prisma schema out of sync"
```bash
npx prisma db push
npx prisma generate
```

## Additional Commands

```bash
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create migrations
npm run lint               # Run ESLint
npm run build              # Production build
```
