# Deployment — Frontend on Vercel, Backend on Render

The frontend never calls the backend from the browser directly: `next.config.ts`
rewrites `/api/*` to `BACKEND_URL` **server-side**, so the browser only talks to
the Vercel domain and the auth cookie stays first-party. This is why the split
across two hosts works without CORS or third-party-cookie problems.

```
Browser ──HTTPS──▶ Vercel (Next.js)  ──/api/* rewrite──▶ Render (Express+Mongo) ──▶ MongoDB Atlas
```

---

## 0) MongoDB Atlas (required — Render has no local Mongo)

1. Create a free cluster at https://www.mongodb.com/atlas.
2. Add a database user + allow network access (`0.0.0.0/0` for simplicity).
3. Copy the connection string, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/nexus_saas`
4. **Seed it** from your machine (one time):
   ```bash
   cd backend
   MONGODB_URI="mongodb+srv://.../nexus_saas" npm run seed
   ```

---

## 1) Backend on Render

**Option A — Blueprint (uses `render.yaml`):** Render → **New + → Blueprint** →
select this repo. It picks up `render.yaml` (rootDir `backend`, index
provisioning before `npm start`, health check `/health/ready`). Then fill the secret env vars.

**Option B — Manual:** New + → **Web Service** → this repo →
- Root Directory: `backend`
- Build: `npm install`  ·  Start: `npm run db:indexes && npm start`

**Env vars (Render):**
| Key | Value |
|---|---|
| `MONGODB_URI` | your Atlas SRV string |
| `JWT_SECRET` | a strong secret — **must match Vercel** |
| `CORS_ORIGINS` | your Vercel URL, e.g. `https://sass-software.vercel.app` |
| `CRON_SECRET` | any strong string |
| `ENABLE_CRON` | `true` |
| `NODE_ENV` | `production` |

Render injects `PORT` automatically (the app reads `process.env.PORT`). After
deploy you get a URL like `https://sass-backend.onrender.com` — copy it.

> Free Render services cold-start (~50s) after idle; the first request may be slow.

---

## 2) Frontend on Vercel

Vercel detected two services and offered a multi-service `vercel.json`.
**Skip that** — the backend is on Render. Instead:

- **Root Directory: `frontend`**  (Vercel → Project → Settings → General)
- Framework preset: **Next.js** (auto)

**Env vars (Vercel → Settings → Environment Variables):**
| Key | Value |
|---|---|
| `BACKEND_URL` | your Render URL, e.g. `https://sass-backend.onrender.com` |
| `JWT_SECRET` | **same** value as Render |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL |

`BACKEND_URL` is read at **build time** by `next.config.ts`, so redeploy after
setting/changing it.

---

## 3) Verify

1. Open the Vercel URL → `/login` → sign in with `gym@demo.com` / `password123`.
2. The dashboard loads (that means `/api/me` proxied to Render and the cookie verified).
3. If login fails: check `JWT_SECRET` is identical on both hosts, and that the
   Atlas DB was seeded.

## Notes / gotchas
- **Secrets never live in git** — `.env` files are ignored; only `*.env.example` are committed. Set real values in the Render/Vercel dashboards.
- The in-process `node-cron` runs on Render (a persistent server). Free instances that sleep may miss the 02:00 run — for guaranteed runs, hit `/api/gym/cron/daily` with the `x-cron-secret` header from an external scheduler, or use Render Cron Jobs (`node src/jobs/runDaily.js`).
- Production startup synchronizes MongoDB indexes before serving traffic. Configure Atlas backups/PITR and test a restore before onboarding customers.
