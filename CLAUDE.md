# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Secret Management - A Next.js 14 application for managing secrets/environment variables with AES-256-GCM encryption, RBAC, and multi-tenant architecture.

## Commands

```bash
# Development
npm run dev           # Start dev server on port 3002

# Build
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint

# Database (Prisma)
npx prisma migrate dev --name init       # Run migrations
npx prisma generate                       # Generate Prisma client
npx prisma studio                        # Open database GUI
npx prisma db push                       # Push schema changes (prototyping)
```

## Architecture

### Data Model
```
Organization (top-level container)
├── Project (belongs to org)
│   ├── ProjectEnvironment (dev, staging, prod)
│   ├── Folder (hierarchical, nested)
│   │   └── Secret (encrypted with AES-256-GCM)
│   ├── Secret (encrypted)
│   │   └── SecretVersion (history)
│   ├── Role (permissions)
│   ├── ProjectMember
│   └── AuditLog
├── OrgMember (org-level roles: owner, admin, member)
└── Alert (notifications)
```

### Key Files

- **Auth**: `src/lib/auth.ts` - NextAuth configuration
- **Encryption**: `src/lib/encryption.ts` - AES-256-GCM encryption/decryption
- **Permissions**: `src/lib/permissions.ts` - RBAC permission checks
- **Services**: `src/lib/services/*.service.ts` - Business logic layer
- **Database**: `prisma/schema.prisma` - Database schema
- **API Routes**: `src/app/api/**/route.ts` - API endpoints

### API Patterns

All API routes follow consistent patterns:
- Use `requireAuth()` for authentication
- Return `{ success, data, message }` responses
- Use Zod schemas for validation in `src/lib/schemas/`
- Service layer handles business logic

### Frontend Structure

```
src/app/
├── (auth)/          # Login, register pages
├── (dashboard)/     # Protected pages
│   ├── organizations/[slug]/
│   │   ├── projects/[projectId]/
│   │   │   ├── secrets/
│   │   │   ├── environments/
│   │   │   ├── members/
│   │   │   └── settings/
│   │   ├── members/
│   │   ├── settings/
│   │   └── alerts/
│   └── alerts/      # Global alerts page
└── api/             # API routes
```

## Database

PostgreSQL with Prisma ORM. Key models:
- User, Organization, Project, ProjectEnvironment
- Folder, Secret, SecretVersion
- Role, ProjectMember, OrgMember
- AuditLog, Alert

## Environment Variables

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=...
ENCRYPTION_KEY=...
```
