# IRONMAN 70.3 Florida Training Dashboard

Full-stack training dashboard for the 21-week build to IRONMAN 70.3 Florida (Haines City, FL — Dec 13, 2026).

## Stack

- **Frontend**: React + Vite + Tailwind CSS (`frontend/`)
- **Backend**: Node/Express + Prisma + Postgres (`backend/`)
- In production, the Express server also serves the built frontend, so the whole app runs as a single deployable service.

## Local development

Requires Node 20+ and a Postgres database (a free Railway/Neon/Supabase instance works fine — SQLite isn't used here since production needs real persistence).

```bash
npm run install:all        # installs both frontend and backend deps

# one-time: create the database and seed the 21-week plan
cd backend
cp .env.example .env       # fill in DATABASE_URL at minimum
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

Backend (`backend/.env` — see `.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `PORT` | Server port (default `4000`) |
| `APP_TZ` | Timezone used to resolve "today" server-side (default `America/New_York`) |
| `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET` / `WHOOP_REDIRECT_URI` | Whoop OAuth app credentials (optional — see Wearables below) |
| `GARMIN_PERSONAL_API_KEY` | Garmin Personal API key (optional — see Wearables below) |
| `AUTO_SYNC_MINUTES` | How often to auto-sync Whoop + Garmin. Defaults to `15` on Railway and `0` (off) elsewhere; `0` disables |

`APP_TZ` matters because week/session boundaries are calendar days — it should match where you actually train, not the server's default timezone, so "today's session" flips over at local midnight rather than UTC midnight.

## Wearables

The Fitness page has a Wearables panel for daily biometrics, separate from the manually-logged fitness tests.

### Whoop (live sync)

Whoop has a self-serve developer API:

1. Register an app at [developer.whoop.com](https://developer.whoop.com).
2. Set the redirect URI to `<your-domain>/api/integrations/whoop/callback` (both a `localhost:4000` one for local dev and your production Railway domain if you want both to work).
3. Set `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_REDIRECT_URI` as environment variables (locally in `.env`, in production via Railway's Variables tab).
4. Redeploy/restart, then click "Connect Whoop" on the Fitness page and authorize.
5. Click "Sync Now" to pull the last 30 days of recovery, sleep, and strain data. Tokens auto-refresh; sync again anytime for new data.

### Garmin (personal API key)

Garmin's Personal API (free, read-only, your own data) works with a key instead of an OAuth login:

1. On [Garmin Connect](https://connect.garmin.com/app/settings/personalApiToken), click Create Key, accept the terms, pick an expiry (30 days to 1 year), and copy the key — it's only shown once.
2. Set it as `GARMIN_PERSONAL_API_KEY` (locally in `backend/.env`, in production via Railway's Variables tab) and redeploy/restart.
3. Click "Sync Now" on the Garmin card (Fitness page). It pulls the last 30 days of steps, resting HR, Body Battery, stress, HRV, sleep, calories and activities; training load is each day's activities' loads summed. For a longer backfill, `POST /api/integrations/garmin/sync?days=110` (max 180).

The key is exchanged for a 24-hour access token automatically (no refresh token — it just re-exchanges the key). When the key expires (Garmin emails a week ahead), generate a new one and update the env var; sync will say so if Garmin rejects it. Deleting the key on Garmin Connect revokes access immediately.

### Automatic sync

The server syncs Whoop and Garmin by itself every 15 minutes (set `AUTO_SYNC_MINUTES` to change it, `0` to turn it off). It runs inside the backend process, so there is no separate cron service. The first run 30 seconds after a (re)deploy catches up on the last 30 days of Garmin data; later runs refresh just the last 3 days. Runs are serialized per provider, so a manual **Sync Now** and a scheduled run never overlap (Whoop refresh tokens are single-use). Providers that aren't connected are skipped, and each run logs one `[auto-sync]` line.

It is on by default only on Railway: a local dev server shares the production database, and two processes refreshing Whoop's single-use token could break the connection. If a scheduled run fails (for example an expired Garmin key), the card on the Fitness page shows the reason.

## Deploying to Railway

This repo deploys as two Railway services in one project: the app (Express + built frontend) and a managed Postgres database.

1. **Push this repo to GitHub.**
2. **Create a Railway project** at [railway.app](https://railway.app) → "New Project" → "Deploy from GitHub repo" → select this repo. This creates the app service.
3. **Add Postgres**: in the same project, "New" → "Database" → "Add PostgreSQL". Railway provisions it with its own persistent volume automatically — no manual volume setup needed.
4. **Set environment variables** on the app service:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (references the Postgres service directly)
   - `APP_TZ` = `America/New_York`
   - Whoop vars if you're using that integration (see above), with the redirect URI pointed at your Railway domain
5. **Deploy.** Railway auto-detects `railway.json` at the repo root, which runs `npm run build` (installs both apps + builds the frontend) and `npm start` (applies pending Prisma migrations, then starts the server).
6. **Generate a domain**: Settings → Networking → Generate Domain on the app service.
7. **Seed the database once**, after the first successful deploy. Using the Railway CLI: `railway run npm run seed` (scoped to the app service). **Only do this once** — see the re-seeding note above.

### Redeploys

Every subsequent push to your connected branch redeploys automatically. Migrations run automatically via `npm start`; the seed step does not (and should not) re-run.
