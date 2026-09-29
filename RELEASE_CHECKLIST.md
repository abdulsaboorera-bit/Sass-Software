# Release Checklist

Run these checks before handing a gym tenant to a customer:

```bash
cd backend
npm ci
npm test
npm audit --omit=dev
npm run db:indexes

cd ../frontend
npm ci
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

Production requirements:

- Set `MONGODB_URI`, `JWT_SECRET`, `CRON_SECRET`, `CORS_ORIGINS`, and `BACKEND_URL` in the hosting providers.
- Set `BACKEND_URL` to the actual Render primary URL, for example `https://sass-backend-ske8.onrender.com`.
- Run `npm run db:indexes` against the production database before accepting traffic.
- Configure MongoDB Atlas backups/PITR and complete one isolated restore test.
- Configure real payment, email, WhatsApp, and SMS providers before advertising those channels.
- Test signup, plan creation, membership enrollment, partial payment, renewal, check-in/out, expenses, reports, portal booking, and receipt download on staging.
- Test the Vercel preview at 320px and desktop widths with a real gym owner account.
