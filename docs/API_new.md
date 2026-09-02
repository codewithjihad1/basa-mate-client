# BasaMate API Reference

REST API for BasaMate — a shared-expense tracker for bachelor "basas" (shared houses).
Members record meals, expenses and deposits inside a billing cycle; at the end of the cycle
the server computes a settlement showing who owes and who gets a refund.

- **Base URL (dev):** `http://localhost:4000`
- **API prefix:** `/api/v1` (from `API_VERSION` in `src/config/constants.ts`)
- **Content type:** `application/json` (the CSV report is the one exception)
- **Source of truth:** routes are mounted in `src/app.ts`; each module lives under `src/modules/<name>/`

Every example below was executed against a running server; the response bodies are real,
trimmed only where a field list repeats.

---

## Table of contents

1. [Conventions](#conventions)
2. [Authentication](#authentication)
3. [Roles and permissions](#roles-and-permissions)
4. [Rate limits](#rate-limits)
5. [Errors](#errors)
6. [Endpoints](#endpoints)
   - [Health](#health)
   - [Auth](#auth)
   - [Basas](#basas)
   - [Members](#members)
   - [Invitations](#invitations)
   - [Billing cycles](#billing-cycles)
   - [Meals](#meals)
   - [Expenses](#expenses)
   - [Deposits](#deposits)
   - [Settlement](#settlement)
   - [Reports](#reports)
   - [Notifications](#notifications)
7. [Settlement calculation](#settlement-calculation)
8. [Known gaps](#known-gaps)

---

## Conventions

### Response envelope

Every JSON endpoint (except the CSV report) returns one of two shapes.

Success:

```json
{
  "success": true,
  "data": { },
  "message": "Operation completed successfully"
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "CYCLE_CLOSED",
    "message": "Cannot add expenses to a closed cycle",
    "details": null
  }
}
```

`details` is present only for validation errors and a few specific cases (rate limiting,
unique-constraint conflicts).

### Status codes

| Code | Used for |
| --- | --- |
| `200` | Successful read or update |
| `201` | Resource created (`POST /basas`, `POST /cycles`, `POST /expenses`, `POST /deposits`, `POST /meals`, `POST /members`, `POST /invitations`, settlement `generate`) |
| `204` | Success with no body (`POST /auth/reset-password`, `DELETE /invitations/:id`) |
| `400` | Validation failure or a business rule rejection |
| `401` | Missing / invalid / expired token |
| `403` | Authenticated but not permitted (not a member, or role lacks the permission) |
| `404` | Resource or route not found |
| `409` | Conflict (duplicate email, active cycle already exists, already finalized) |
| `429` | Rate limited |
| `500` | Unhandled server error |

### IDs

All IDs are CUIDs (`cmtjmjzyk0001hjcjutfcnarj`). Two different identifiers appear in request bodies
and it matters which one you send:

| Identifier | What it is | Where it is used |
| --- | --- | --- |
| **user id** | `User.id` — the account | `POST /members` (`userId`), `POST /meals` (`memberId` — see note) |
| **member id** | `BasaMember.id` — a user's membership of one basa | `POST /deposits` (`memberId`), expense `allocations[].memberId`, `PATCH`/`DELETE /members/:memberId`, meal list filter `memberId` |

> **Note:** `POST /meals` takes the **user id** in its `memberId` field (the service resolves the
> membership with `where: { basaId, userId: input.memberId }`), while `POST /deposits` and expense
> allocations take the **member id**. This asymmetry is real, not a documentation slip — see
> [Known gaps](#known-gaps).

### Money

Money is stored as SQL `numeric` and serialized as a **string** (`"1200"`, `"350.50"`) to avoid
float rounding. Send numbers or numeric strings in requests; both are coerced. Meal quantities
come back as strings too (`"2"`).

### Dates

Send dates as ISO-8601 (`"2026-09-02"` or a full timestamp); they are parsed with `z.coerce.date()`.
Responses are always full ISO timestamps in UTC. Cycle start/end dates are normalized to the start
and end of the local day of the server.

### Pagination

Endpoints that paginate accept `page` (default `1`) and `limit` (default `20`, max `100`) and wrap
their results:

```json
{
  "items": [ ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

### Request tracing

Send `x-request-id` and it is echoed back; otherwise the server generates a UUID and returns it in
the `x-request-id` response header. It is also attached to server-side error logs.

### CORS and cookies

CORS allows exactly one origin — `FRONTEND_URL` (default `http://localhost:3000`) — with
`credentials: true`. Request bodies are limited to 2 MB.

---

## Authentication

All endpoints except `/health` and the `/auth` entry points require an access token, supplied
either way:

```
Authorization: Bearer <accessToken>
```

...or the cookies that `POST /auth/register`, `POST /auth/login` and `POST /auth/refresh` set
automatically:

```
Set-Cookie: accessToken=<jwt>;  Max-Age=900;    Path=/;            HttpOnly; SameSite=Lax
Set-Cookie: refreshToken=<jwt>; Max-Age=604800; Path=/api/v1/auth; HttpOnly; SameSite=Lax
```

The `Authorization` header wins when both it and the cookie are present.

| | `accessToken` | `refreshToken` |
| --- | --- | --- |
| Path | `/` — sent to every endpoint | `/api/v1/auth` — sent only to the auth routes |
| Max-Age | tracks `JWT_EXPIRES_IN` (default 15m) | tracks `REFRESH_TOKEN_EXPIRES_IN` (default 7d) |
| Read by | `authenticate` on every protected route | `POST /auth/refresh` |

Both are `HttpOnly`, so JavaScript cannot read them; both are `SameSite=Lax` in development and
`SameSite=None; Secure` when `NODE_ENV=production`, so they survive a frontend on a different
domain. `POST /auth/logout` expires both.

Scoping the refresh cookie to `/api/v1/auth` keeps the long-lived credential off every business
request — only the two routes that need it ever receive it.

A browser client can therefore hold no tokens at all: call `/auth/login` with
`credentials: "include"`, and both the session and its renewal ride on cookies. The response body
still carries both tokens for native and server-side clients, which keep using the
`Authorization` header and the request body as before.

| Token | Secret | Lifetime |
| --- | --- | --- |
| Access | `JWT_SECRET` | `JWT_EXPIRES_IN`, default `15m` (`expiresIn: 900` is reported in the response) |
| Refresh | `REFRESH_TOKEN_SECRET` | `REFRESH_TOKEN_EXPIRES_IN`, default `7d` |

The access token payload is `{ sub: <userId>, type: "access" }`. On every authenticated request the
user is re-read from the database and must still exist with `status = "ACTIVE"`.

Logout is client-side: `POST /auth/logout` returns success but does not revoke anything, because
tokens are stateless. Discard both tokens on the client.

---

## Roles and permissions

Roles live on the membership (`BasaMember.role`), not on the user, so a user can be an `OWNER` of
one basa and a `VIEWER` of another. `resolveBasaMembership` runs before every basa-scoped route and
rejects non-members with `403 BASA_ACCESS_DENIED`.

| Permission | OWNER | MANAGER | MEMBER | VIEWER |
| --- | :---: | :---: | :---: | :---: |
| `view_basa` | ✅ | ✅ | ✅ | ✅ |
| `manage_members` | ✅ | ✅ | — | — |
| `add_meals` | ✅ | ✅ | ✅ | — |
| `edit_own_meals` | ✅ | ✅ | ✅ | — |
| `edit_others_meals` | ✅ | ✅ | — | — |
| `add_expense` | ✅ | ✅ | ✅¹ | — |
| `manage_deposits` | ✅ | ✅ | — | — |
| `view_settlement` | ✅ | ✅ | ✅ | ✅ |
| `finalize_settlement` | ✅ | ✅ | — | — |
| `basa_settings` | ✅ | ✅ | — | — |
| `subscription` | ✅ | — | — | — |

`PLATFORM_ADMIN` holds every permission.

¹ `add_expense` is granted to `MEMBER` in the permission table, but `ExpenseService` rejects both
`MEMBER` and `VIEWER` on create/update. In practice **only OWNER and MANAGER can write expenses.**

Per-endpoint enforcement is a mix of two mechanisms — `requirePermission(...)`/`requireRole(...)`
middleware, and role checks inside the service. The "Requires" line on each endpoint below states
the effective rule.

---

## Rate limits

An in-memory limiter keyed by IP (plus user id once authenticated). Because it is per-process and
in-memory, it resets on restart and is not shared across instances.

| Scope | Window | Max requests |
| --- | --- | --- |
| Everything | 60 s | 300 |
| `POST /auth/register`, `POST /auth/login` | 15 min | 20 |
| `POST /auth/forgot-password`, `POST /auth/reset-password` | 60 min | 5 |

Exceeding a limit returns `429`:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests, please try again later",
    "details": { "retryAfterMs": 58981 }
  }
}
```

---

## Errors

Validation failures return `400` with one entry per failed field:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [
      { "path": "name", "message": "Basa name must be at least 2 characters" }
    ]
  }
}
```

### Error codes

| Code | Status | Meaning |
| --- | --- | --- |
| `AUTH_REQUIRED` | 401 | No token, bad token, expired token, or inactive account |
| `INVALID_CREDENTIALS` | 401 / 400 | Wrong email or password; invalid or used reset token |
| `EMAIL_ALREADY_EXISTS` | 409 | Registration email is taken |
| `EMAIL_NOT_VERIFIED` | 401 | Email verification required (`requireVerifiedEmail`) |
| `BASA_NOT_FOUND` | 404 | Basa does not exist or is archived |
| `BASA_ACCESS_DENIED` | 403 | Not an active member of the basa |
| `MEMBER_NOT_FOUND` | 404 | Membership not found in this basa |
| `INVITATION_EXPIRED` | 400 / 409 | Invitation past `expiresAt` |
| `INVITATION_ALREADY_USED` | 400 | Invitation is not `PENDING` |
| `CYCLE_NOT_FOUND` | 404 | Cycle does not exist in this basa |
| `CYCLE_CLOSED` | 400 / 409 | Cycle is closed and rejects writes |
| `INVALID_MEAL` | 404 | Meal entry not found |
| `INVALID_EXPENSE` | 404 | Expense not found (or soft-deleted) |
| `INVALID_ALLOCATION` | 400 | Custom amounts do not sum to the total, or percentages do not sum to 100 |
| `INSUFFICIENT_PERMISSION` | 403 | Role lacks the required permission |
| `SETTLEMENT_NOT_FOUND` | 404 | No settlement for this cycle |
| `SETTLEMENT_ALREADY_FINALIZED` | 409 | Settlement is finalized |
| `SUBSCRIPTION_LIMIT_REACHED` | 403 | Plan limit hit (defined, not yet enforced) |
| `RATE_LIMITED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Request failed schema validation |
| `NOT_FOUND` | 404 | Generic not found, including unknown routes |
| `CONFLICT` | 409 | Generic conflict, including Prisma `P2002` unique violations |
| `BAD_REQUEST` | 400 | Generic business-rule rejection |
| `INTERNAL_ERROR` | 500 | Unhandled error (details are never leaked) |

---

## Endpoints

### Health

#### `GET /health`

Unauthenticated liveness probe. Does **not** check the database.

```json
{ "status": "ok", "uptime": 8.93 }
```

---

### Auth

Mounted at `/api/v1/auth`.

#### `POST /auth/register`

Creates an account and returns tokens immediately. Rate limited (20 / 15 min).

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 2–100 chars, trimmed |
| `email` | string | valid email, ≤ 255, lowercased |
| `password` | string | 8–100 chars |

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"name":"Doc User","email":"doc@example.com","password":"password123"}'
```

`201`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmtjmjzxb0000hjcja9ffvjkw",
      "name": "Doc User",
      "email": "doc@example.com",
      "createdAt": "2026-09-02T04:57:19.775Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "tokenType": "Bearer",
      "expiresIn": 900
    }
  },
  "message": "Registration successful. Please verify your email."
}
```

The response also sets the `accessToken` and `refreshToken` cookies (see
[Authentication](#authentication)).

Errors: `409 EMAIL_ALREADY_EXISTS`, `400 VALIDATION_ERROR`.

A verification email is sent only when `EMAIL_PROVIDER` is set to something other than `console`,
or when `NODE_ENV=production`. Email verification is not enforced on any route by default.

#### `POST /auth/login`

Rate limited (20 / 15 min).

```json
{ "email": "doc@example.com", "password": "password123" }
```

`200` — same `{ user, tokens }` shape as register, with `user` reduced to `{ id, name, email }`,
plus both auth cookies.

Errors: `401 INVALID_CREDENTIALS` (wrong email *or* password — deliberately indistinguishable),
`401 AUTH_REQUIRED` when the account is not `ACTIVE`.

#### `POST /auth/refresh`

Takes the refresh token from the request body, or — when the body omits it — from the
`refreshToken` cookie:

```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
```

A browser client sending the cookie can post an empty body (`{}`).

`200` → `{ "data": { "tokens": { accessToken, refreshToken, tokenType, expiresIn } } }`.
Both tokens are reissued and both cookies are rewritten.

Errors: `401 AUTH_REQUIRED` when neither source supplies a token, when the token is invalid or is
not a refresh token, or when the user is gone/inactive.

#### `GET /auth/me`

Requires a token.

```json
{
  "success": true,
  "data": {
    "id": "cmtjmjzxb0000hjcja9ffvjkw",
    "name": "Doc User",
    "email": "doc@example.com",
    "emailVerifiedAt": null,
    "avatarUrl": null,
    "timezone": "Asia/Dhaka",
    "status": "ACTIVE",
    "createdAt": "2026-09-02T04:57:19.775Z",
    "updatedAt": "2026-09-02T04:57:19.775Z"
  },
  "message": "Current user retrieved"
}
```

#### `POST /auth/logout`

Requires a token. Clears both auth cookies and returns `200` with `data: null`. The JWT
itself stays valid until it expires — there is no server-side blocklist — so a client holding the
token in memory must discard it too.

#### `POST /auth/forgot-password`

Rate limited (5 / hour). Body: `{ "email": "..." }`.

Always returns `200` with
`"If an account exists for that email, a reset link has been sent."`, whether or not the address is
registered. The reset token is valid for **15 minutes** and is delivered by email; only its SHA-256
hash is stored.

#### `POST /auth/reset-password`

Rate limited (5 / hour).

```json
{ "token": "<token from the email>", "password": "newpassword123" }
```

`204 No Content` on success. Errors: `400 INVALID_CREDENTIALS` when the token is unknown, expired,
or already used.

---

### Basas

Mounted at `/api/v1/basas`. All routes require authentication; `:basaId` routes require an active
membership.

#### `POST /basas`

Creates a basa, makes the caller its `OWNER`, and seeds default meal types
(Breakfast, Lunch, Dinner) and 11 expense categories (Grocery, Meat, Fish, Vegetables, Rice, Oil,
Spices, Eggs, Gas, Kitchen Supplies, Other).

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 2–100 chars, required |
| `location` | string | ≤ 255, optional |
| `currency` | string | exactly 3 chars, default `"BDT"` |
| `cycleStartDay` | number | 1–28, default `1` |

`201` returns the basa with `members`, `mealTypes` and `expenseCategories` included:

```json
{
  "id": "cmtjmjzyk0001hjcjutfcnarj",
  "name": "Docs Basa",
  "location": "Dhaka",
  "currency": "BDT",
  "cycleStartDay": 1,
  "status": "ACTIVE",
  "deletedAt": null,
  "members": [
    { "id": "cmtjmjzyo0002hjcj4nn6p0s1", "userId": "cmtjmjzxb0000hjcja9ffvjkw", "role": "OWNER", "status": "ACTIVE", "joinedAt": "2026-09-02T04:57:19.824Z", "leftAt": null }
  ],
  "mealTypes": [
    { "id": "cmtjmjzyw0003hjcj1d7x42cj", "name": "Breakfast", "isActive": true, "sortOrder": 1 }
  ],
  "expenseCategories": [
    { "id": "cmtjmjzz20006hjcjcmeaxf1y", "name": "Grocery", "isActive": true, "sortOrder": 1 }
  ]
}
```

#### `GET /basas`

Lists the caller's active memberships, newest first. Each row is the membership, with the basa
embedded and counted:

```json
{
  "role": "OWNER",
  "joinedAt": "2026-09-02T04:57:19.824Z",
  "basa": {
    "id": "cmtjmjzyk0001hjcjutfcnarj",
    "name": "Docs Basa",
    "location": "Dhaka",
    "currency": "BDT",
    "cycleStartDay": 1,
    "status": "ACTIVE",
    "_count": { "members": 1, "cycles": 0 }
  }
}
```

Archived basas (`deletedAt` set) are excluded. Not paginated.

#### `GET /basas/:basaId`

**Requires:** any active member.
Returns the basa with all members (each with `user: { id, name, email }`), meal types and expense
categories, sorted by `sortOrder`.

Errors: `403 BASA_ACCESS_DENIED`, `404 BASA_NOT_FOUND`.

#### `PATCH /basas/:basaId`

**Requires:** `basa_settings` — OWNER or MANAGER.
Body is `POST /basas` with every field optional. Returns the updated basa (no relations).

#### `DELETE /basas/:basaId`

**Requires:** OWNER only (the middleware allows MANAGER, but the service rejects anyone who is not
the owner with `403 INSUFFICIENT_PERMISSION`).

Soft delete — sets `deletedAt`, and the basa disappears from `GET /basas` and from membership
resolution. Nothing is erased.

```json
{ "id": "cmtjmmxw9000k0acjg0chksi3", "deletedAt": "2026-09-02T04:59:37.652Z" }
```

---

### Members

Mounted at `/api/v1/basas/:basaId/members`.

#### `GET /basas/:basaId/members`

**Requires:** any active member. Returns every membership — including `INACTIVE` ones — ordered by
`joinedAt`, each with `user: { id, name, email, emailVerifiedAt }`.

#### `POST /basas/:basaId/members`

**Requires:** OWNER, MANAGER or PLATFORM_ADMIN.

| Field | Type | Rules |
| --- | --- | --- |
| `userId` | string | **user id** of an existing account |
| `role` | enum | `OWNER` \| `MANAGER` \| `MEMBER` \| `VIEWER`, default `MEMBER` |

Adds the user directly, without an invitation — so it only works for a user id you already know.
If the user was previously `INACTIVE` in this basa they are reactivated with the new role.

`201`:

```json
{
  "id": "cmtjmmxzk00110acjz25e4nw3",
  "basaId": "cmtjmmxw9000k0acjg0chksi3",
  "userId": "cmtjmmxvu000j0acjdivp2f7m",
  "role": "MEMBER",
  "status": "ACTIVE",
  "joinedAt": "2026-09-02T04:59:37.232Z",
  "leftAt": null,
  "user": { "id": "cmtjmmxvu000j0acjdivp2f7m", "name": "Second User", "email": "second@example.com", "status": "ACTIVE" }
}
```

Errors: `409 CONFLICT` when the user is already an active member.

#### `PATCH /basas/:basaId/members/:memberId`

**Requires:** OWNER, MANAGER or PLATFORM_ADMIN. `:memberId` is the **member id**.

```json
{ "role": "MANAGER", "status": "ACTIVE" }
```

Both fields optional. Setting `status: "INACTIVE"` also stamps `leftAt`.
Demoting the **last active OWNER** is refused with `409 CONFLICT`.

#### `DELETE /basas/:basaId/members/:memberId`

**Requires:** OWNER, MANAGER or PLATFORM_ADMIN.

Soft removal — sets `status: "INACTIVE"` and `leftAt`; historical meals, expenses and deposits stay
intact. You cannot remove yourself (`403`) or the last active owner (`409`).

```json
{ "id": "cmtjmmxzk00110acjz25e4nw3", "status": "INACTIVE", "leftAt": "2026-09-02T04:59:37.266Z" }
```

---

### Invitations

Mounted at `/api/v1/basas/:basaId/invitations`, plus one top-level accept route.

The raw token is emailed to the invitee and never returned by the API — only its SHA-256 hash is
stored.

#### `GET /basas/:basaId/invitations`

**Requires:** any active member. Newest first.

```json
{
  "id": "cmtjmk0cv000rhjcj3dpq96bk",
  "email": "invitee@example.com",
  "role": "MEMBER",
  "status": "PENDING",
  "expiresAt": "2026-09-09T04:57:20.334Z",
  "acceptedAt": null,
  "createdAt": "2026-09-02T04:57:20.335Z"
}
```

`status` is `PENDING` | `ACCEPTED` | `EXPIRED`.

#### `POST /basas/:basaId/invitations`

**Requires:** OWNER, MANAGER or PLATFORM_ADMIN.

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | valid email, ≤ 255, lowercased |
| `role` | enum | `OWNER` \| `MANAGER` \| `MEMBER` \| `VIEWER`, default `MEMBER` |
| `expiresInDays` | number | 1–30, default `7` |

`201` returns `{ id, email, role, status, expiresAt, createdAt }`.
Errors: `409 CONFLICT` when a `PENDING` invitation already exists for that email in this basa.

#### `POST /basas/:basaId/invitations/:invitationId/resend`

**Requires:** OWNER, MANAGER or PLATFORM_ADMIN.

Regenerates the token (**invalidating the previous link**) and re-sends the email. `expiresAt` is
not extended.

```json
{ "success": true, "data": { "id": "cmtjmmy7100150acj3fpcukno" }, "message": "Invitation resent" }
```

Errors: `409 CONFLICT` if the invitation is not `PENDING` or has already expired.

#### `DELETE /basas/:basaId/invitations/:invitationId`

**Requires:** OWNER, MANAGER or PLATFORM_ADMIN. Hard delete. `204 No Content`.

#### `POST /invitations/:token/accept`

**Requires:** authentication only — this route is not basa-scoped, because the caller is not a
member yet. `:token` is the raw token from the email.

The signed-in user's email must match the invitation's email. On success the user joins the basa
with the invited role and the invitation flips to `ACCEPTED`.

Errors: `400 BAD_REQUEST` (unknown token, or the invitation was issued to a different email),
`400 INVITATION_ALREADY_USED`, `400 INVITATION_EXPIRED`.

---

### Join Requests

Join requests let users join a basa by entering a human-readable **join code** (e.g., `BM-A7K9`). The
basan owner or manager must approve the request before membership is granted. This is the alternative
to the email-based invitation flow.

**Join code format:** `BM-XXXX` (4 alphanumeric chars) or `BM-XXX-XX` (5–6 chars with a dash for
readability). Characters exclude ambiguous lookalikes (`0/O`, `1/I/L`).

#### `POST /basas/join`

**Requires:** authentication. Submit a join request using a basa's join code.

| Field | Type | Rules |
| --- | --- | --- |
| `joinCode` | string | required, 4–6 chars, case-insensitive (uppercased automatically) |
| `note` | string | optional, ≤ 500 chars — a message to the basa owner/manager |

```bash
curl -X POST http://localhost:4000/api/v1/basas/join \
  -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"joinCode":"BM-A7K9","note":"I would like to join!"}'
```

`201`:

```json
{
  "success": true,
  "data": {
    "id": "cmtk1wq9y0001tfcjxjrg64jy",
    "note": "I would like to join!",
    "status": "PENDING",
    "createdAt": "2026-09-02T12:07:08.038Z",
    "basa": {
      "id": "cmtjw9enx0002xbcjv6m22mu5",
      "name": "Bachelor's420",
      "joinCode": "BM-GNJS"
    }
  },
  "message": "Join request submitted"
}
```

Errors: `404 BASA_NOT_FOUND` (no basa with that join code), `409 CONFLICT` (already a member or
already have a pending request).

#### `GET /join-requests/me`

**Requires:** authentication. Lists the caller's own join requests, newest first.

```json
{
  "success": true,
  "data": [
    {
      "id": "cmtk1wq9y0001tfcjxjrg64jy",
      "note": "I would like to join!",
      "status": "PENDING",
      "createdAt": "2026-09-02T12:07:08.038Z",
      "updatedAt": "2026-09-02T12:07:08.038Z",
      "basa": {
        "id": "cmtjw9enx0002xbcjv6m22mu5",
        "name": "Bachelor's420",
        "joinCode": "BM-GNJS"
      }
    }
  ],
  "message": "Join requests retrieved"
}
```

`status` is `PENDING` | `ACCEPTED` | `REJECTED` | `CANCELLED`.

#### `GET /basas/:basaId/join-requests`

**Requires:** OWNER, MANAGER or PLATFORM_ADMIN. Lists join requests for a basa, newest first.
Query: `status` (optional, filter by status).

```json
{
  "success": true,
  "data": [
    {
      "id": "cmtk1wq9y0001tfcjxjrg64jy",
      "note": "I would like to join!",
      "status": "PENDING",
      "createdAt": "2026-09-02T12:07:08.038Z",
      "updatedAt": "2026-09-02T12:07:08.038Z",
      "user": {
        "id": "cmtk1wpt50000tfcjpnuq6n4j",
        "name": "Test Join User",
        "email": "test-join-user@example.com",
        "avatarUrl": null
      }
    }
  ],
  "message": "Join requests retrieved"
}
```

#### `POST /basas/:basaId/join-requests/:requestId/accept`

**Requires:** OWNER, MANAGER or PLATFORM_ADMIN. Accepts a pending join request, creates a
`BasaMember` with role `MEMBER` (or the role specified in the request), and notifies the
requester.

```bash
curl -X POST "http://localhost:4000/api/v1/basas/$BASA_ID/join-requests/$REQUEST_ID/accept" \
  -H "Authorization: Bearer $OWNER_TOKEN"
```

`200`:

```json
{
  "success": true,
  "data": {
    "id": "cmtk1wq9y0001tfcjxjrg64jy",
    "basaId": "cmtjw9enx0002xbcjv6m22mu5",
    "userId": "cmtk1wpt50000tfcjpnuq6n4j",
    "role": "MEMBER",
    "status": "ACCEPTED",
    "note": "I would like to join!",
    "reviewedBy": "cmtjw8nn70000xbcj34laqhcg",
    "reviewedAt": "2026-09-02T12:07:09.993Z",
    "createdAt": "2026-09-02T12:07:08.038Z",
    "updatedAt": "2026-09-02T12:07:09.994Z",
    "membershipId": "cmtk1wrop0002tfcj6e4zibn6"
  },
  "message": "Join request accepted"
}
```

The requester receives a `INVITATION` notification with title "Join request accepted".

Errors: `404 NOT_FOUND`, `409 CONFLICT` (request already reviewed, or user already an active member).

#### `POST /basas/:basaId/join-requests/:requestId/reject`

**Requires:** OWNER, MANAGER or PLATFORM_ADMIN. Rejects a pending join request and notifies
the requester.

```bash
curl -X POST "http://localhost:4000/api/v1/basas/$BASA_ID/join-requests/$REQUEST_ID/reject" \
  -H "Authorization: Bearer $OWNER_TOKEN"
```

`200` returns the updated join request with `status: "REJECTED"` and `reviewedBy`/`reviewedAt`
populated.

The requester receives a `INVITATION` notification with title "Join request declined".

Errors: `404 NOT_FOUND`, `409 CONFLICT` (request already reviewed).

#### `GET /basas/:basaId` (joinCode field)

The basa's `joinCode` is included in `GET /basas/:basaId` responses so the owner/manager can
share it:

```json
{
  "id": "cmtjw9enx0002xbcjv6m22mu5",
  "name": "Bachelor's420",
  "joinCode": "BM-GNJS",
  ...
}
```

---

### Billing cycles

Mounted at `/api/v1/basas/:basaId/cycles`. A cycle is the accounting period that meals, expenses,
deposits and the settlement all hang off. Status is `ACTIVE` | `CLOSED` | `REOPENED`.

#### `POST /basas/:basaId/cycles`

**Requires:** `basa_settings` — OWNER or MANAGER.

| Field | Type | Rules |
| --- | --- | --- |
| `startDate` | date | required; normalized to 00:00 |
| `endDate` | date | optional; normalized to 23:59:59.999. Defaults to one month minus one day after `startDate` |

Only one `ACTIVE` cycle per basa: a second one returns `409 CONFLICT`.

```json
{
  "id": "cmtjmk013000hhjcj4h99ridt",
  "basaId": "cmtjmjzyk0001hjcjutfcnarj",
  "startDate": "2026-08-31T18:00:00.000Z",
  "endDate": "2026-09-30T17:59:59.999Z",
  "status": "ACTIVE",
  "closedAt": null,
  "closedBy": null
}
```

#### `GET /basas/:basaId/cycles`

**Requires:** any active member. Query: `page`, `limit`. Newest `startDate` first, each row carrying
`_count` of `meals`, `expenses` and `deposits`.

```json
{
  "items": [
    { "id": "cmtjmk013000hhjcj4h99ridt", "startDate": "2026-08-31T18:00:00.000Z", "endDate": "2026-09-30T17:59:59.999Z", "status": "ACTIVE", "_count": { "meals": 0, "expenses": 0, "deposits": 0 } }
  ],
  "pagination": { "page": 1, "limit": 5, "total": 1, "totalPages": 1 }
}
```

#### `GET /basas/:basaId/cycles/:cycleId`

**Requires:** any active member. Returns the cycle with its `settlement` (or `null`).

#### `GET /basas/:basaId/cycles/:cycleId/dashboard`

**Requires:** any active member. Cycle totals for a summary screen.

```json
{
  "members": 1,
  "totalMeals": "2",
  "totalGroceryCost": "1200",
  "mealRate": 0,
  "sharedExpenses": "500",
  "totalDeposits": "2000"
}
```

`mealRate` is `0` until a settlement has been generated; afterwards it is the settlement's rate.

#### `POST /basas/:basaId/cycles/:cycleId/close`

**Requires:** `finalize_settlement` — OWNER or MANAGER.

Locks the cycle: meals, expenses and deposits can no longer be created, edited or deleted. Uses a
`SELECT … FOR UPDATE` so two simultaneous closes cannot both win. Sets `status: "CLOSED"`,
`closedAt`, `closedBy`. A settlement can only be generated after this.

Errors: `409 CYCLE_CLOSED` if it is already closed.

#### `POST /basas/:basaId/cycles/:cycleId/reopen`

**Requires:** `finalize_settlement` — OWNER or MANAGER.

```json
{ "reason": "Two meals were missing for September" }
```

`reason` is required (3–500 chars). Only a `CLOSED` cycle can be reopened (`409` otherwise). The
cycle becomes `REOPENED` and any settlement is marked `RECALCULATING`.

> The reason is validated but currently discarded — it is not persisted to the audit log.

---

### Meals

Mounted at `/api/v1/basas/:basaId/cycles/:cycleId/meals`. Meals drive the settlement: the meal rate
is grocery spend divided by total meals.

#### `POST /…/meals`

**Requires:** any active member except `VIEWER`. A `MEMBER` may only record **their own** meals;
OWNER and MANAGER may record for anyone.

| Field | Type | Rules |
| --- | --- | --- |
| `memberId` | string | **user id** of the eater (see [IDs](#ids)) |
| `date` | date | required |
| `entries` | array | ≥ 1 entry |
| `entries[].mealTypeId` | string | meal type id from the basa |
| `entries[].quantity` | number | > 0, ≤ 1000 (fractions allowed) |

```bash
curl -X POST "$BASE/basas/$BASA/cycles/$CYCLE/meals" \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"memberId":"cmtjmjzxb0000hjcja9ffvjkw","date":"2026-09-02",
       "entries":[{"mealTypeId":"cmtjmjzyw0003hjcj1d7x42cj","quantity":2}]}'
```

`201` returns a count, not the rows:

```json
{ "success": true, "data": { "count": 1 }, "message": "Meal recorded" }
```

Errors: `404 CYCLE_NOT_FOUND`, `400 CYCLE_CLOSED`, `404 MEMBER_NOT_FOUND`,
`403 INSUFFICIENT_PERMISSION`.

#### `GET /…/meals`

**Requires:** any active member. Query filters (all optional): `from`, `to` (ISO dates on `date`),
`memberId` (**member id**), `mealTypeId`. Ordered by date, then creation. Not paginated.

```json
{
  "id": "cmtjmk02s000ihjcjyz06d260",
  "date": "2026-09-02T00:00:00.000Z",
  "quantity": "2",
  "note": null,
  "memberId": "cmtjmjzyo0002hjcj4nn6p0s1",
  "mealTypeId": "cmtjmjzyw0003hjcj1d7x42cj",
  "mealType": { "name": "Breakfast" },
  "member": { "user": { "name": "Doc User", "email": "doc@example.com" } }
}
```

#### `GET /…/meals/summary`

**Requires:** any active member. Meal totals per member for the cycle.

```json
{
  "items": [
    { "memberId": "cmtjmjzyo0002hjcj4nn6p0s1", "userId": "cmtjmjzxb0000hjcja9ffvjkw", "name": "Doc User", "totalMeals": 2 }
  ],
  "totalMeals": 2
}
```

#### `PATCH /…/meals/:mealId`

**Requires:** the meal's owner, or OWNER/MANAGER.

```json
{ "quantity": 3, "note": "double portion" }
```

`quantity` is required (> 0, ≤ 1000); `note` optional (≤ 500). Blocked on a closed cycle
(`400 CYCLE_CLOSED`).

#### `DELETE /…/meals/:mealId`

**Requires:** the meal's owner, or OWNER/MANAGER. Hard delete, blocked on a closed cycle.

```json
{ "success": true, "data": { "id": "cmtjmmy0y00120acjt9glloge" }, "message": "Meal deleted" }
```

---

### Expenses

Mounted at `/api/v1/basas/:basaId/cycles/:cycleId/expenses`.

Three types, and the type decides how the cost is settled:

| `type` | Settlement treatment |
| --- | --- |
| `GROCERY` | Pooled. Divided by total meals to produce the meal rate, then charged per meal eaten |
| `SHARED` | Split explicitly via `allocations`; each member is charged their allocated amount |
| `OTHER` | Recorded but not charged to anyone by the settlement |

#### `POST /…/expenses`

**Requires:** OWNER or MANAGER (see the ¹ note in [Roles](#roles-and-permissions)).

| Field | Type | Rules |
| --- | --- | --- |
| `amount` | number | > 0, required |
| `date` | date | required |
| `type` | enum | `GROCERY` \| `SHARED` \| `OTHER`, default `GROCERY` |
| `description` | string | ≤ 500, optional |
| `categoryId` | string | expense category id, optional |
| `paidByMemberId` | string | **member id** who paid, optional |
| `receiptUrl` | string | valid URL, optional |
| `notes` | string | ≤ 1000, optional |
| `allocationMethod` | enum | `EQUAL` \| `CUSTOM_AMOUNT` \| `PERCENTAGE` — required when `type` is `SHARED` |
| `allocations` | array | required and non-empty when `type` is `SHARED` |
| `allocations[].memberId` | string | **member id** |
| `allocations[].amount` | number | > 0 — required for `CUSTOM_AMOUNT` |
| `allocations[].percentage` | number | 0–100 — required for `PERCENTAGE` |

Each allocation must carry `amount` or `percentage`.

Allocation rules:

- `EQUAL` — the amount is divided evenly across the listed members; per-entry values are ignored.
- `CUSTOM_AMOUNT` — the `amount` values must sum **exactly** to the expense amount, else
  `400 INVALID_ALLOCATION`.
- `PERCENTAGE` — the `percentage` values must sum to 100 (±0.0001), else `400 INVALID_ALLOCATION`.
  Each stored allocation keeps both the percentage and the computed amount.

Shared expense example:

```bash
curl -X POST "$BASE/basas/$BASA/cycles/$CYCLE/expenses" \
  -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"amount":500,"date":"2026-09-02","description":"Gas bill","type":"SHARED",
       "allocationMethod":"EQUAL",
       "allocations":[{"memberId":"cmtjmjzyo0002hjcj4nn6p0s1","amount":500}]}'
```

`201`:

```json
{
  "id": "cmtjmk04v000khjcj1l7szqgr",
  "type": "SHARED",
  "amount": "500",
  "allocations": [
    { "id": "cmtjmk04w000lhjcjhhetddhs", "expenseId": "cmtjmk04v000khjcj1l7szqgr", "memberId": "cmtjmjzyo0002hjcj4nn6p0s1", "amount": "500", "percentage": null }
  ]
}
```

Omitting `allocationMethod`/`allocations` on a `SHARED` expense returns:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [
      { "path": "allocationMethod", "message": "allocationMethod is required for shared expenses" },
      { "path": "allocations", "message": "allocations are required for shared expenses" }
    ]
  }
}
```

#### `GET /…/expenses`

**Requires:** any active member.

| Query | Type | Notes |
| --- | --- | --- |
| `from`, `to` | ISO date | range on `date` |
| `categoryId` | string | |
| `paidBy` | string | **member id** |
| `type` | enum | `GROCERY` \| `SHARED` \| `OTHER` |
| `search` | string | case-insensitive substring of `description` |
| `minAmount`, `maxAmount` | number | |
| `page`, `limit` | number | default `1` / `20`, max `100` |

Returns `{ items, pagination }`, newest `date` first; each item includes `category`, `paidBy.user`
and `allocations[].member.user`. Soft-deleted expenses are excluded.

> ⚠️ This endpoint currently returns `500 INTERNAL_ERROR` — see [Known gaps](#known-gaps).

#### `GET /…/expenses/:expenseId`

**Requires:** any active member. Returns one expense with `category`, `paidBy` and `allocations`.
`404 INVALID_EXPENSE` if missing or soft-deleted.

#### `PATCH /…/expenses/:expenseId`

**Requires:** OWNER or MANAGER. Every create field is optional; omitted fields are untouched.

Sending `allocations` **replaces** the whole allocation set (the old rows are deleted first) and
re-validates it against the new or existing amount and type. Blocked on a closed cycle.

#### `DELETE /…/expenses/:expenseId`

**Requires:** OWNER or MANAGER. Soft delete (`softDeleted: true`, `deletedAt` stamped); the row
stops counting toward settlements and listings. Blocked on a closed cycle.

```json
{ "success": true, "data": { "id": "cmtjmmy2n00130acjfm042va2" }, "message": "Expense deleted" }
```

---

### Deposits

Mounted at `/api/v1/basas/:basaId/cycles/:cycleId/deposits`. A deposit is money a member has paid
into the basa fund for the cycle; the settlement compares it against what they consumed.

#### `POST /…/deposits`

**Requires:** OWNER or MANAGER.

| Field | Type | Rules |
| --- | --- | --- |
| `memberId` | string | **member id** (not user id) |
| `amount` | number | > 0, required |
| `paymentMethod` | enum | `CASH` \| `BKASH` \| `NAGAD` \| `BANK` \| `OTHER`, default `CASH` |
| `reference` | string | ≤ 255, optional — e.g. a bKash transaction id |
| `notes` | string | ≤ 1000, optional |
| `transactionDate` | date | optional, defaults to now |

`201`:

```json
{
  "id": "cmtjmk05y000mhjcjxb6zjbse",
  "basaId": "cmtjmjzyk0001hjcjutfcnarj",
  "cycleId": "cmtjmk013000hhjcj4h99ridt",
  "memberId": "cmtjmjzyo0002hjcj4nn6p0s1",
  "amount": "2000",
  "paymentMethod": "BKASH",
  "reference": "TX123",
  "notes": null,
  "recordedBy": "cmtjmjzxb0000hjcja9ffvjkw",
  "transactionDate": "2026-09-02T04:57:20.085Z",
  "softDeleted": false,
  "member": { "id": "cmtjmjzyo0002hjcj4nn6p0s1", "role": "OWNER", "user": { "name": "Doc User" } }
}
```

Errors: `404 CYCLE_NOT_FOUND`, `400 CYCLE_CLOSED`, `404 MEMBER_NOT_FOUND`,
`403 INSUFFICIENT_PERMISSION`.

#### `GET /…/deposits`

**Requires:** any active member. All non-deleted deposits in the cycle, newest `transactionDate`
first, each with `member.user`. Not paginated.

#### `PATCH /…/deposits/:depositId`

**Requires:** OWNER or MANAGER. All create fields optional. Blocked on a closed cycle.

#### `DELETE /…/deposits/:depositId`

**Requires:** OWNER or MANAGER. Soft delete. Returns `{ "id": "…" }`.

---

### Settlement

Cycle-scoped routes at `/api/v1/basas/:basaId/cycles/:cycleId/settlement`, plus two top-level
routes under `/api/v1/settlements`.

Settlement status: `GENERATED` → `FINALIZED`, or `RECALCULATING` after a reopen.

#### `POST /…/settlement/generate`

**Requires:** `finalize_settlement` — OWNER or MANAGER. The cycle **must be closed**.

Recomputes everything from the cycle's meals, expenses and deposits and writes a settlement with one
item per active member. Re-running it **replaces** the previous settlement and its items — unless
that settlement is `FINALIZED`, which is refused.

`201`:

```json
{
  "id": "cmtjmk092000nhjcjsct2i3j7",
  "basaId": "cmtjmjzyk0001hjcjutfcnarj",
  "cycleId": "cmtjmk013000hhjcj4h99ridt",
  "status": "GENERATED",
  "mealRate": "600",
  "totalMeals": "2",
  "totalGroceryCost": "1200",
  "totalSharedExpenses": "500",
  "generatedAt": "2026-09-02T04:57:20.197Z",
  "generatedBy": "cmtjmjzxb0000hjcja9ffvjkw",
  "finalizedAt": null,
  "finalizedBy": null,
  "items": [
    {
      "id": "cmtjmk095000ohjcjixvqpphm",
      "memberId": "cmtjmjzyo0002hjcj4nn6p0s1",
      "initialDeposit": "2000",
      "totalMeals": "2",
      "foodCost": "1200",
      "individualShare": "500",
      "totalCost": "1700",
      "finalBalance": "300",
      "status": "REFUND",
      "settledAmount": "0",
      "remainingAmount": "300",
      "member": { "id": "cmtjmjzyo0002hjcj4nn6p0s1", "role": "OWNER", "user": { "id": "cmtjmjzxb0000hjcja9ffvjkw", "name": "Doc User" } }
    }
  ]
}
```

Errors: `404 CYCLE_NOT_FOUND`, `409 CONFLICT` ("Cycle must be closed before generating settlement"),
`409 SETTLEMENT_ALREADY_FINALIZED`.

Writes a `SETTLEMENT_GENERATED` audit log entry.

#### `POST /…/settlement/finalize`

**Requires:** `finalize_settlement` — OWNER or MANAGER. The cycle must still be `CLOSED`.

Marks the settlement `FINALIZED` with `finalizedAt`/`finalizedBy` and writes a
`SETTLEMENT_FINALIZED` audit entry. Returns the settlement without items.

Errors: `409 CONFLICT` (cycle not closed), `404 SETTLEMENT_NOT_FOUND`,
`409 SETTLEMENT_ALREADY_FINALIZED`.

#### `GET /…/settlement`

**Requires:** any active member. The cycle's settlement with `items` (each with `member.user` and
`payments`) and the `cycle`. `404 SETTLEMENT_NOT_FOUND` if none has been generated.

#### `GET /settlements/:settlementId` and `GET /settlements/:settlementId/items`

Top-level lookups by settlement id, returning the same settlement/item shapes.

> ⚠️ Both are currently unusable — see [Known gaps](#known-gaps). Use the cycle-scoped
> `GET /…/settlement` instead.

---

### Reports

Mounted at `/api/v1/basas/:basaId/cycles/:cycleId/report`. **Requires:** any active member.

#### `GET /…/report`

Full cycle export as JSON: the cycle, its settlement (or `null`), every non-deleted expense with its
category, meal totals per member and deposit totals per member.

```json
{
  "success": true,
  "data": {
    "cycle": { "id": "cmtjmk013000hhjcj4h99ridt", "status": "CLOSED" },
    "settlement": { "id": "cmtjmk092000nhjcjsct2i3j7", "status": "FINALIZED", "items": [] },
    "expenses": [ { "id": "…", "amount": "1200", "date": "2026-09-02T00:00:00.000Z", "category": null } ],
    "meals": [ { "memberId": "cmtjmjzyo0002hjcj4nn6p0s1", "_sum": { "quantity": "2" } } ],
    "deposits": [ { "memberId": "cmtjmjzyo0002hjcj4nn6p0s1", "totalDeposited": "2000" } ]
  },
  "message": "Report generated"
}
```

Errors: `404 CYCLE_NOT_FOUND`.

#### `GET /…/report/csv`

The cycle's expenses as CSV — `Date, Description, Category, Amount`, all fields quoted.

```
Content-Type: text/csv
Content-Disposition: attachment; filename="report-<cycleId>.csv"
```

This route returns raw CSV, not the success envelope.

---

### Notifications

Mounted at `/api/v1/notifications`. Scoped to the authenticated user; no basa membership involved.

#### `GET /notifications`

Query: `page` (default `1`), `limit` (default `20`), `unread=true` to return only unread ones.
`unreadCount` always reflects **all** unread notifications for the user.

```json
{
  "items": [],
  "unreadCount": 0,
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

#### `PATCH /notifications/:id/read`

Marks one notification read (stamps `readAt`) and returns it. `404 NOT_FOUND` if it does not exist
or belongs to someone else.

#### `POST /notifications/read-all`

Marks every unread notification read.

```json
{ "success": true, "data": { "count": 0 }, "message": "All notifications marked as read" }
```

---

## Settlement calculation

Implemented in `src/modules/settlement/settlement.calculator.ts` as pure functions over
`Decimal` values (no floats), unit-tested in `settlement.calculator.test.ts`.

```
mealRate       = totalGroceryCost / totalMeals          (2 dp; 0 when totalMeals <= 0)
foodCost       = memberMeals * mealRate                 (2 dp)
individualShare= sum of the member's SHARED allocations
totalCost      = foodCost + individualShare
finalBalance   = initialDeposit - totalCost
```

Item status follows the sign of `finalBalance`:

| `finalBalance` | `status` | Meaning |
| --- | --- | --- |
| `> 0` | `REFUND` | The basa owes the member |
| `< 0` | `PAYMENT_DUE` | The member owes the basa |
| `= 0` | `SETTLED` | Square |

`remainingAmount` starts at `|finalBalance|` and `settledAmount` at `0`; payments against an item
are recorded in the `payments` relation.

Worked example (the verified run above): grocery spend `1200` over `2` meals gives a meal rate of
`600`. The single member ate 2 meals (`foodCost = 1200`), carried `500` of a shared gas bill
(`individualShare = 500`, `totalCost = 1700`) and had deposited `2000`, so
`finalBalance = 300` → `REFUND`.

Inputs to the calculation:

- **Meals** — all `MealEntry` rows in the cycle, summed per member.
- **Grocery** — `Expense` rows with `type = GROCERY` and `softDeleted = false`.
- **Shared** — `ExpenseAllocation` rows belonging to `type = SHARED`, non-deleted expenses.
- **Deposits** — `DepositTransaction` rows with `softDeleted = false`.
- **Members** — memberships with `status = ACTIVE` at generation time.

`OTHER` expenses are excluded from the settlement entirely.

---

## Known gaps

Verified against a running server on 2026-09-02. These are behaviours of the current code, not
design intent.

1. **`GET /basas/:basaId/cycles/:cycleId/expenses` returns `500`.**
   `validate({ query })` writes coerced values back with `Object.assign(req.query, …)`, but Express 5
   exposes `req.query` as a re-parsing getter, so the coercion is discarded. `page`/`limit` reach
   Prisma as strings (`take: "2"`) and Prisma rejects the query. Every other listing endpoint is
   unaffected because none of them coerce query values. Fixing the middleware to store the parsed
   query on its own property (or reading the validated value in the controller) repairs it.

2. **`GET /settlements/:settlementId` and `/items` are unusable.**
   They run `resolveBasaMembership`, which reads `req.params.basaId` — absent on these routes — and
   falls back to `req.body.basaId`; with no body on a GET, that throws and the request `500`s.
   Sending a JSON body with `basaId` gets past the membership check, but the controller then reads
   `req.params.basaId` again (empty string), so the lookup returns `404 SETTLEMENT_NOT_FOUND`. Use
   the cycle-scoped `GET /basas/:basaId/cycles/:cycleId/settlement`.

3. **`memberId` means different things in different endpoints.** `POST /meals` expects a **user id**;
   `POST /deposits` and expense `allocations[].memberId` expect a **member id**. Passing the wrong
   one yields `404 MEMBER_NOT_FOUND` on deposits, or a foreign-key error on allocations.

4. **`SettlementService.reopen` has no route.** Settlements are only moved to `RECALCULATING`
   indirectly, by reopening the cycle.

5. **`reopen` discards its `reason`.** The field is required and validated, then dropped — no audit
   record is written.

6. **`add_expense` is granted to `MEMBER` in `ROLE_PERMISSIONS` but denied by `ExpenseService`.**
   The service check wins; members cannot create expenses.

7. **Email verification is never enforced.** `requireVerifiedEmail` exists but is not mounted on any
   route, and verification emails are only sent when `EMAIL_PROVIDER != "console"` or in production.

8. **Rate limiting is per-process and in-memory.** It resets on restart and does not hold across
   multiple instances; back it with Redis before running more than one process.
