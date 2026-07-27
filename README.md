# IRONMAN 70.3 Florida Training Dashboard

Full-stack training dashboard for the 21-week build to IRONMAN 70.3 Florida (Haines City, FL — Dec 13, 2026).

## Stack

- **Frontend**: React + Vite + Tailwind CSS (`frontend/`)
- **Backend**: Node/Express + Prisma + SQLite (`backend/`)
- In production, the Express server also serves the built frontend, so the whole app runs as a single deployable service.

## Local development

Requires Node 20+.

```bash
npm run install:all        # installs both frontend and backend deps

# one-time: create the database and seed the 21-week plan
cd backend
npx prisma migrate dev
npm run seed
cd ..

# run both dev servers (separate terminals)
npm run dev:backend        # http://localhost:4000
npm run dev:frontend       # http://localhost:5173 (proxies /api to :4000)
```

Open http://localhost:5173 during development.

### Re-seeding

`npm run seed` (from `backend/`) refuses to run if the database already has weeks in it, since reseeding wipes all completion history and logged fitness tests. Pass `--force` if you genuinely want to reset everything:

```bash
node prisma/seed.js --force
```

## Environment variables

Backend (`backend/.env`):

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | SQLite file path | `file:./dev.db` |
| `PORT` | Server port | `4000` |
| `APP_TZ` | Timezone used to resolve "today" server-side | `America/New_York` |

`APP_TZ` matters because week/session boundaries are calendar days — it should match where you actually train (Tampa/Eastern), not the server's default timezone, so "today's session" flips over at local midnight rather than UTC midnight.

## Deploying to Railway

This repo is set up to deploy as a single Railway service (Express serves both the API and the built frontend).

1. **Push this repo to GitHub.** Railway deploys from a GitHub repo (or you can use the Railway CLI to deploy a local directory directly — see their docs if you'd rather skip GitHub).
2. **Create a Railway project** at [railway.app](https://railway.app) → "New Project" → "Deploy from GitHub repo" → select this repo.
3. **Add a persistent volume.** SQLite needs a real disk, and Railway's default filesystem doesn't persist across deploys. In the service's Settings → Volumes, add a volume and mount it at `/data`.
4. **Set environment variables** on the service:
   - `DATABASE_URL` = `file:/data/prod.db`
   - `APP_TZ` = `America/New_York`
5. **Deploy.** Railway auto-detects `railway.json` at the repo root, which runs `npm run build` (installs both apps + builds the frontend) and `npm start` (applies pending Prisma migrations, then starts the server).
6. **Seed the database once**, after the first successful deploy. Using the Railway CLI:
   ```bash
   railway run --service <your-service-name> npm run seed
   ```
   Or open a shell to the service from the Railway dashboard and run `npm run seed` from the repo root. **Only do this once** — see the re-seeding note above.
7. Railway gives you a `*.up.railway.app` URL — that's your dashboard, reachable from any device.

### Redeploys

Every subsequent push to your connected branch redeploys automatically. Migrations run automatically via `npm start`; the seed step does not (and should not) re-run.
