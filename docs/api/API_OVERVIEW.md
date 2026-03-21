# API Overview

## Base URL

```
http://localhost:3002/api    # Local dev
http://localhost:3000/api    # Docker prod
```

## Authentication

All API endpoints require an authenticated session cookie (set by NextAuth after login). No `Authorization: Bearer` header needed — session is managed via `next-auth.session-token` httpOnly cookie.

```
Cookie: next-auth.session-token=<token>
```

**Unauthenticated routes:**
- `POST /api/auth/[...nextauth]` — login/logout
- `POST /api/auth/register` — register with invite code
- `GET /api/auth/session` — get current session
- `POST /api/cron/rotation` — protected by `CRON_SECRET` header

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "error": "Error message",
  "success": false
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (no permission) |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Internal server error |

---

## Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/[...nextauth]` | No | NextAuth handler (login/logout via form) |
| GET | `/api/auth/session` | No | Get current user session |
| POST | `/api/auth/register` | No | Register with invite code (rate-limited: 3/min) |

**Register body:**
```json
{
  "email": "user@example.com",
  "password": "Secret123!",
  "name": "User Name",
  "inviteCode": "ABC12345"
}
```

**Rate limit response (429):**
```json
{
  "error": "Too many registration attempts. Please try again later.",
  "retryAfterMs": 45000
}
```

---

## Organization Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/organizations` | Yes | List user's organizations |
| POST | `/api/organizations` | Yes | Create organization |
| GET | `/api/organizations/[slug]` | Yes | Get org + projects (non-admins get stripped member list) |
| PATCH | `/api/organizations/[slug]` | Yes | Update org (admin only) |
| DELETE | `/api/organizations/[slug]` | Yes | Delete org (owner only) |
| GET | `/api/organizations/[slug]/members` | Yes | List org members |
| POST | `/api/organizations/[slug]/members` | Yes | Add member |
| DELETE | `/api/organizations/[slug]/members/[memberId]` | Yes | Remove member |
| GET | `/api/organizations/[slug]/invitations` | Yes | List invite codes |
| POST | `/api/organizations/[slug]/invitations` | Yes | Create invite code (admin only) |
| DELETE | `/api/organizations/[slug]/invitations/[id]` | Yes | Revoke invite code |
| POST | `/api/organizations/[slug]/invitations/[id]/regenerate` | Yes | Regenerate code |
| GET | `/api/organizations/[slug]/integrations` | Yes | List integrations |
| POST | `/api/organizations/[slug]/integrations` | Yes | Create integration |
| DELETE | `/api/organizations/[slug]/integrations/[id]` | Yes | Delete integration |

---

## Project Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/projects` | Yes | List user's projects |
| POST | `/api/projects` | Yes | Create project |
| GET | `/api/projects/[id]` | Yes | Get project |
| PATCH | `/api/projects/[id]` | Yes | Update project |
| DELETE | `/api/projects/[id]` | Yes | Delete project |
| GET | `/api/projects/[id]/secrets` | Yes | List secrets (encrypted) |
| POST | `/api/projects/[id]/secrets` | Yes | Create/update secrets |
| GET | `/api/projects/[id]/folders` | Yes | List folders |
| POST | `/api/projects/[id]/folders` | Yes | Create folder |
| GET | `/api/projects/[id]/environments` | Yes | List environments |
| POST | `/api/projects/[id]/environments` | Yes | Create environment |
| GET | `/api/projects/[id]/members` | Yes | List project members |
| POST | `/api/projects/[id]/members` | Yes | Add member (autocomplete: `/api/projects/[id]/members/search`) |
| GET | `/api/projects/[id]/members/search` | Yes | Search org members not yet in project |
| GET | `/api/projects/[id]/roles` | Yes | List project roles |
| POST | `/api/projects/[id]/roles` | Yes | Create custom role |
| DELETE | `/api/projects/[id]/roles/[roleId]` | Yes | Delete role |
| GET | `/api/projects/[id]/dynamic-secrets` | Yes | List dynamic secrets |
| POST | `/api/projects/[id]/dynamic-secrets` | Yes | Create dynamic secret |
| DELETE | `/api/projects/[id]/dynamic-secrets/[id]` | Yes | Delete dynamic secret |
| GET | `/api/projects/[id]/rotation-jobs` | Yes | List rotation jobs |
| POST | `/api/projects/[id]/rotation-jobs` | Yes | Create rotation job |
| PATCH | `/api/projects/[id]/rotation-jobs/[jobId]` | Yes | Update rotation job |
| DELETE | `/api/projects/[id]/rotation-jobs/[jobId]` | Yes | Delete rotation job |
| GET | `/api/projects/[id]/audit-logs` | Yes | List audit logs |

### Member Search (Autocomplete)

```
GET /api/projects/[id]/members/search
```

Returns org members who are NOT already in the project, excluding the current user.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "...", "email": "user@example.com", "name": "User Name" }
  ]
}
```

---

## Secret Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/secrets/[id]` | Yes | Get secret (decrypted) |
| PATCH | `/api/secrets/[id]` | Yes | Update secret |
| DELETE | `/api/secrets/[id]` | Yes | Delete secret |
| GET | `/api/secrets/[id]/audit-logs` | Yes | Secret-specific audit logs |

---

## Folder Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/api/folders/[id]` | Yes | Update folder |
| DELETE | `/api/folders/[id]` | Yes | Delete folder |

---

## Alert Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/alerts` | Yes | List alerts for current user |
| POST | `/api/alerts/mark-read` | Yes | Mark alert(s) as read |
| GET | `/api/alerts/unread-count` | Yes | Get unread count |

---

## Cron Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/cron/rotation` | `CRON_SECRET` header | Trigger pending secret rotations |

---

## Rate Limiting

Sliding window in-memory rate limiter (no Redis).

| Endpoint | Limit |
|----------|-------|
| `POST /api/auth/[...nextauth]` | 5 requests / 60s per IP |
| `POST /api/auth/register` | 3 requests / 60s per IP |

Rate limit response headers: `Retry-After`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Middleware Pattern

API routes use middleware wrappers. Handler receives a single `auth` object (not `req, params`):

```typescript
// Correct
export const GET = withProjectAccess()(async (auth) => {
  const { projectId, user, isOwner } = auth;
  // ...
});

// Wrong — will cause TypeScript error
export const GET = withProjectAccess()(async (req, auth) => { ... });
```

Middleware helpers:
- `requireAuth()` → `{ user }` or throws 401
- `requireOrgAccess(orgId, role?)` → `{ ...user, orgId, isOwner }`
- `requireOrgOwner(orgId)` → requires 'owner' role
- `requireProjectAccess(projectId, permission?)` → `{ user, projectId, isOwner }`
- `withProjectAccess(permission?)` → HOC for route handlers
