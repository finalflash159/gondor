# Authentication API

## Overview

NextAuth.js v5 with JWT credentials provider. Session stored in `next-auth.session-token` httpOnly cookie. No `Authorization: Bearer` header needed.

## Endpoints

### Register — `POST /api/auth/register`

All users must register via an organization invite code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Secret123!",
  "name": "User Name",
  "inviteCode": "ABC12345"
}
```

**Response (201):**
```json
{
  "id": "cuid...",
  "email": "user@example.com",
  "name": "User Name"
}
```

**Errors:** 400 (email taken, invalid code, validation), 429 (rate limited: 3/min)

### Login — `POST /api/auth/[...nextauth]`

Handled by NextAuth form action. Submit to `/api/auth/signin`.

**Rate limited:** 5 req/min per IP.

### Session — `GET /api/auth/session`

Returns current user session:

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "name": "..."
  }
}
```

### Logout — `POST /api/auth/signout`

Handled by NextAuth form action.
