# NexusSoft SaaS API — Express + Mongoose + MongoDB

Standalone backend for the NexusSoft multi-tenant SaaS. This **replaces the
previous Next.js API routes + Prisma + PostgreSQL data layer** with a dedicated
Express server on MongoDB (Mongoose). All five verticals were migrated
(school, clinic, restaurant, bookshop, gym); the **gym module** additionally
gained a large set of production features (see below).

The Next.js app in the parent folder remains the frontend — point it at this API
(see [Frontend integration](#frontend-integration)).

---

## Architecture (clean layering)

```
server/
├── src/
│   ├── config/            env + Mongo connection
│   ├── models/            Mongoose schemas
│   │   ├── core/          Tenant, User, RefreshToken, AuditLog, TenantRole, TenantUser, Branch, Notification
│   │   ├── gym/           Member, MembershipPlan, Trainer, Session, CheckIn, GymInvoice, GymPayment, BodyMeasurement
│   │   ├── school/  clinic/  restaurant/  bookshop/
│   │   └── index.js       single import surface for all 45 models
│   ├── middleware/        auth, tenant, rbac, scope (trainer), validate, error
│   ├── services/          business logic (auth, notification, gym/*)
│   ├── controllers/       thin HTTP layer (validation + service calls)
│   ├── routes/            express routers per module
│   ├── jobs/              node-cron scheduler + daily pass + standalone runner
│   ├── utils/             jwt, password, cookies, ids, dates, query, crud factory
│   ├── seed/              idempotent seed + system role definitions
│   ├── app.js             express app (helmet, cors, cookies, routes, errors)
│   └── index.js           entrypoint (connect -> listen -> start cron)
```

Request flow: `route -> middleware (auth/tenant/rbac/scope) -> controller (zod) -> service -> model`.

---

## Setup & run

**Prerequisites:** Node 18+, a running MongoDB (local `mongodb://127.0.0.1:27017` or Atlas).

```bash
cd server
cp .env.example .env          # adjust MONGODB_URI / JWT_SECRET / CRON_SECRET
npm install
npm run seed                  # super admin, 5 tenants, system roles, demo gym data
npm run dev                   # http://localhost:4000  (nodemon)   |  npm start for prod
```

### Demo logins (password: `password123`)
| Login | Role | Scope |
|---|---|---|
| `admin@nexussoft.io` | platform super admin | all tenants |
| `gym@demo.com` | Owner | Iron Pulse Gym |
| `reception@demo.com` | Receptionist | Iron Pulse Gym |
| `trainer@demo.com` | Trainer (scoped) | only assigned members |
| `school@demo.com`, `clinic@demo.com`, `restaurant@demo.com`, `bookshop@demo.com` | Owner | respective tenant |

---

## Auth

- JWT (HS256) in **httpOnly cookies** `access_token` (15m) + `refresh_token` (7d),
  or `Authorization: Bearer <token>`. Claims/issuer/audiences/TTLs are identical
  to the previous `jose` setup, so already-issued cookies keep working.
- `bcryptjs` (12 rounds) -- existing password hashes verify unchanged.

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/auth/login` | sets cookies, returns `{ user, tenant }` |
| POST | `/api/auth/signup` | creates a user |
| POST | `/api/auth/refresh` | rotates tokens |
| POST | `/api/auth/logout` | revokes refresh token |
| GET | `/api/auth/me` | `{ user, tenant, roleSlug, permissions }` (flat) |
| GET | `/api/me` | `{ user: { user, tenant, tenantRole, permissions } }` (nested, compat) |

**Note:** `GET /api/me` is the compat endpoint matching the old Next.js `/api/me`
shape. The dashboard reads `data.user.user.id`, `data.user.tenant.industry`, etc.

---

## RBAC

Permission-string model (unchanged vocabulary). A `TenantRole.permissions` array
is checked per request; `*` = all, `resource.*` = any action on a resource.

**System roles** (seeded per tenant, see `src/seed/roles.js`):
- **owner** -> `["*"]` (full access)
- **receptionist** -> manage members, billing, attendance (+ front-desk perms across modules)
- **trainer** -> `members.view.assigned`, `trainers.view.self`, `attendance.mark`, `sessions.view`

**Trainer scoping:** member read endpoints run `memberViewScope`. Callers with
`members.view` see everyone; callers with only `members.view.assigned` are
restricted to the members assigned to the Trainer profile linked to their user
(`Trainer.userId`). Verified: a trainer sees only their assigned members and is
`403` on create/analytics.

---

## Gym module -- enhancements

**Members** (`/api/gym/members`)
- `effectiveStatus` (`ACTIVE|EXPIRED|FROZEN|CANCELLED`) + `daysUntilExpiry` computed on every read.
- `notesHistory[]` -- append-only (never overwritten). `POST /:id/notes`.
- `renewals[]` -- full renewal history. `POST /:id/renew` extends expiry, records history, raises an invoice.
- `lastAttendanceAt`, `currentStreak`, `longestStreak`, trainer assignment, freeze bookkeeping.
- `GET /:id/payments` -- full payment history.
- Collection-style: `PATCH /` (id in body), `DELETE /?id=`, `GET /:id`.

**Attendance** (`/api/gym/attendance`)
- `POST /check-in` -- timestamped, **one per member per calendar day** (unique index -> `409`), updates streak.
- `POST /check-out`, `GET /` (filter by member/date).
- `GET /summary?year&month` -- monthly totals, unique members, per-day, busiest day (aggregation).
- `GET /members/:id/summary` -- per-member days attended + streak.
- `GET /trends?days=30` -- daily check-in trend.

**Check-in Kiosk** (`/api/gym/checkins`)
- `GET /` -- recent check-ins (paginated, `{ checkins, pagination }`).
- `POST /` -- toggle by `memberNo`: `{ action: "checkin"|"checkout", member: {...} }`.

**Billing** (`/api/gym/billing`)
- `POST /invoices` -- invoice with **due date** + generated **invoiceRef** (`INV-YYMM-XXXXXX`), emits PAYMENT_DUE.
- `POST /payments` -- records payment, reconciles invoice (`PAID`/`PARTIAL`).
- `POST /mark-overdue` -- manual; the daily cron does this automatically.
- `GET /invoices`, `GET /invoices/:id` (with payments).

**Payments** (`/api/gym/payments`)
- Full CRUD collection: list, create, update, delete.
- `GET /` -- paginated list with member populate, filter by `memberId`, `invoiceId`, `method`.

**Trainers** (`/api/gym/trainers`)
- CRUD + `POST /:id/assign`, `DELETE /assign/:memberId`.
- `GET /:id/members` (roster), `GET /:id/workload`, `GET /workload` (leaderboard), `GET /me/members` (trainer self).
- Collection-style: `PATCH /` (id in body), `DELETE /?id=`.

**Analytics** (`/api/gym/analytics`) -- aggregation pipelines
- `GET /dashboard` -- members (active/expired/frozen), 6-month revenue, pending payments, 30-day attendance trend, trainers.
- `GET /members`, `GET /revenue?months`, `GET /pending-payments`.

**Config resources:** `/api/gym/plans`, `/api/gym/sessions`, `/api/gym/measurements`.

**Notifications** (`/api/gym/notifications`) -- see below.

---

## CRUD factory (`src/utils/crud.js`)

`makeCrudRouter()` generates a complete tenant-scoped, permission-guarded Express
router. It registers **both** collection-style and REST-style endpoints so every
frontend page convention works:

| Method | Path | Shape | Style |
|---|---|---|---|
| GET | `/` | `{ [listKey]: [...], pagination? }` | collection |
| POST | `/` | `{ [itemKey]: doc }` (201) | collection |
| PATCH | `/` | `{ [itemKey]: doc }` (id in body) | collection |
| DELETE | `/?id=` | `{ success: true }` | collection |
| GET | `/:id` | `{ [itemKey]: doc }` | REST |
| PATCH | `/:id` | `{ [itemKey]: doc }` | REST |
| PUT | `/:id` | `{ [itemKey]: doc }` | REST |
| DELETE | `/:id` | `{ success: true }` | REST |

All lean queries use `lean({ virtuals: true })` so Mongoose virtuals (like
`saleItems`, `orderItems`, `menuItems`, `plan`, `trainer`) are included in
responses.

### Options

```js
makeCrudRouter({
  model,              // Mongoose model
  permission,         // Base permission string (e.g., "members")
  listKey,            // Response key for list (e.g., "members")
  itemKey,            // Response key for single item (e.g., "member")
  paginated,          // Boolean (default: true)
  searchFields,       // Array of fields to search with $regex
  populate,           // Array of Mongoose populate configs
  sort,               // Sort object (default: { createdAt: -1 })
  filterFields,       // Query params to pass as exact-match filters
  beforeCreate,       // Async hook: (payload, req) => modifiedPayload
  afterCreate,        // Async hook: (doc, req) => void
  decorateRows,       // Async hook: (rows, req) => modifiedRows (e.g. add _count)
  perms,              // Override permission strings: { view, create, edit, remove }
})
```

---

## Notification service (event-based, provider-agnostic)

`src/services/notification.service.js` writes every triggered event to the
`Notification` outbox (`PENDING`) and delivers via pluggable **channel adapters**.
No real WhatsApp/email/SMS is wired yet -- only a `LOG`/`IN_APP` adapter exists.

Events: `WELCOME`, `MEMBERSHIP_EXPIRING_SOON`, `MEMBERSHIP_EXPIRED`, `PAYMENT_DUE`,
`PAYMENT_OVERDUE`, `MISSED_ATTENDANCE`. Each has a `dedupeKey` so the daily cron
never double-sends.

Add a real channel later without touching callers:
```js
const notifications = require("./services/notification.service");
notifications.registerAdapter("WHATSAPP", async (n) => {
  await whatsappClient.send(n.recipientContact, n.message);
  return { ok: true };
});
```

---

## Cron / scheduled jobs

`node-cron` runs **in-process** (this is a long-running server, unlike the old
serverless routes). Daily at 02:00 (`CRON_TZ`) it runs the gym daily pass:
expire memberships -> notify expiring-soon -> mark overdue invoices -> notify
missed-attendance -> dispatch pending notifications.

Three ways to run it:
- **In-process** (default): `ENABLE_CRON=true`.
- **External scheduler**: `POST /api/gym/cron/daily` with header `x-cron-secret: <CRON_SECRET>` (Windows Task Scheduler / GitHub Action / cron). Optional body `{ "tenantId": "..." }`.
- **One-shot CLI**: `npm run cron:daily`.

---

## Other modules

CRUD (list/get/create/update/delete), tenant-scoped, permission-guarded:
- **School** `/api/school/{students,classes,attendance,fees,exams}`
- **Clinic** `/api/clinic/{patients,doctors,departments,appointments,prescriptions,medical-records,invoices,payments}`
- **Restaurant** `/api/restaurant/{staff,tables,menu,shifts,suppliers,inventory,orders}` -- `orders` compute subtotal/tax/total + line items via `orderItems` virtual.
- **Bookshop** `/api/bookshop/{books,categories,customers,purchase-orders,sales}` -- `sales` compute totals, **decrement stock**, award loyalty points; `saleItems` virtual populated in list.

List responses: `{ [key]: [...], pagination }`. Common query params: `page`, `limit`, `search`, plus per-resource filters.

---

## Frontend integration

The Next.js app proxies `/api/*` to this backend via `next.config.ts` rewrites.
All endpoints return shapes the existing frontend pages expect:

### Response shapes (compat with old Prisma output)

| Endpoint | Response shape |
|---|---|
| `GET /api/me` | `{ user: { user: {...}, tenant, tenantRole, permissions } }` |
| `GET /api/gym/members` | `{ members: [...], pagination }` |
| `GET /api/gym/plans` | `{ plans: [...] }` (no pagination) |
| `GET /api/gym/trainers` | `{ trainers: [...], pagination }` |
| `GET /api/gym/checkins` | `{ checkins: [...], pagination }` |
| `GET /api/gym/payments` | `{ payments: [...], pagination }` |
| `GET /api/school/students` | `{ students: [...], pagination }` |
| `GET /api/school/classes` | `{ classes: [...] }` (no pagination, `_count.students`) |
| `GET /api/school/fees` | `{ payments: [...], summary, pagination }` |
| `GET /api/clinic/patients` | `{ patients: [...], pagination }` |
| `GET /api/clinic/doctors` | `{ doctors: [...] }` (no pagination) |
| `GET /api/clinic/appointments` | `{ appointments: [...], pagination }` |
| `GET /api/clinic/invoices` | `{ invoices: [...], pagination }` |
| `GET /api/restaurant/orders` | `{ orders: [{..., orderItems: [{..., menuItem}]}], pagination }` |
| `GET /api/restaurant/tables` | `{ tables: [...] }` (no pagination) |
| `GET /api/restaurant/menu` | `{ categories: [{..., menuItems: [...]}] }` |
| `GET /api/restaurant/staff` | `{ staff: [...] }` (no pagination) |
| `GET /api/restaurant/inventory` | `{ items: [...] }` (no pagination) |
| `GET /api/bookshop/books` | `{ books: [...], pagination }` |
| `GET /api/bookshop/customers` | `{ customers: [...] }` (no pagination) |
| `GET /api/bookshop/sales` | `{ sales: [{..., saleItems: [{..., book}]}], pagination }` |

### Collection-style write endpoints

All list resources support:
- `PATCH /` with `{ id, ...fields }` in body (update)
- `DELETE /?id=` (delete)
- `GET /:id` (get one)

Plus REST-style `PATCH /:id` and `DELETE /:id`.

### Setup

1. **Base URL** -- the frontend `next.config.ts` already rewrites `/api/:path*` to `http://localhost:4000/api/:path*`.
2. **Send cookies** -- all requests must use `credentials: "include"` (or axios `withCredentials: true`), since auth is cookie-based.
3. **CORS** -- the frontend origin (`http://localhost:3000`) is in `CORS_ORIGINS`. `credentials: true` is enabled.
4. **Response shape** -- every document exposes `id` (string), matching the old Prisma output. Money fields are plain numbers (not Prisma `Decimal`).
5. **Virtuals** -- Mongoose virtuals (`saleItems`, `orderItems`, `menuItems`, `plan`, `trainer`, `effectiveStatus`, `daysUntilExpiry`) are included in all responses via `lean({ virtuals: true })`.
6. **Data migration** -- this is a fresh MongoDB store. If you need existing PostgreSQL data, export and transform it (ObjectId ids are regenerated). `npm run seed` provides representative demo data.

The old Prisma/PostgreSQL files under `../prisma` and `../src/lib` are left intact
but are no longer the source of truth for these endpoints.
