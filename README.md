# NexusSoft — Multi-Tenant SaaS (Next.js + Express + MongoDB)

Multi-tenant, multi-vertical SaaS covering five business modules — **School,
Clinic, Restaurant, Gym, Bookshop** — on a shared tenant/user/RBAC core.

SQL/Prisma/PostgreSQL has been fully removed. The stack is now:

```
nexus-saas/
├── frontend/    Next.js 16 (App Router) UI — no data layer, calls the backend via /api/* proxy
└── backend/     Express + Mongoose + MongoDB — all APIs, JWT auth, RBAC, cron jobs
```

## Quick start

**Prereqs:** Node 18+, MongoDB running locally (or Atlas).

```bash
# 1) Backend
cd backend
cp .env.example .env          # set MONGODB_URI, JWT_SECRET, CRON_SECRET
npm install
npm run seed                  # super admin, 5 tenants, system roles, demo gym data
npm run dev                   # http://localhost:4000

# 2) Frontend (second terminal)
cd frontend
npm install
npm run dev                   # http://localhost:3000  (proxies /api/* -> :4000)
```

> `frontend/.env` `JWT_SECRET` **must equal** `backend/.env` `JWT_SECRET` — the Next.js
> middleware verifies the auth cookie the backend issues.

### Demo logins (password `password123`)
`admin@nexussoft.io` (super admin) · `gym@demo.com` (gym owner) ·
`school@demo.com` · `clinic@demo.com` ·
`restaurant@demo.com` · `bookshop@demo.com`

## Architecture

- **Auth:** JWT (HS256) in httpOnly cookies (access 15m / refresh 7d); permission-string RBAC with per-tenant system roles (owner / receptionist / trainer / accountant / inventory manager).
- **Gym module** (built in depth): membership status/renewal/notes-history/streaks, per-day check-in dedup, invoices with due-date + auto-overdue, trainer assignment + workload, analytics aggregations, an event-based notification outbox (WhatsApp/email/SMS-ready), and node-cron daily jobs.
- **Frontend ↔ backend:** the Next.js app keeps calling same-origin `/api/*`; `next.config.ts` rewrites proxy those to the backend, and the backend serves the exact response shapes the pages expect.

See [backend/README.md](backend/README.md) for the full API reference and integration notes.
