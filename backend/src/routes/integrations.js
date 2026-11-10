const crypto = require("crypto");
const express = require("express");
const prisma = require("../lib/prisma");
const whoop = require("../lib/whoop");
const garmin = require("../lib/garmin");
const { SyncError, syncWhoop, syncGarmin, getWhoopConnection, getLastError } = require("../lib/sync");

const router = express.Router();

function sendSyncError(res, err) {
  if (!(err instanceof SyncError)) return res.status(500).json({ error: "Sync failed", detail: err.message });
  res.status(err.status).json(err.detail ? { error: err.message, detail: err.detail } : { error: err.message });
}

// In-memory OAuth state store (single-user app, short-lived, process-local is fine).
const pendingStates = new Set();

router.get("/whoop/status", async (req, res) => {
  const conn = await getWhoopConnection();
  res.json({
    configured: whoop.isConfigured(),
    connected: !!conn,
    lastSyncedAt: conn?.lastSyncedAt || null,
    lastError: getLastError("whoop"),
  });
});

router.get("/whoop/connect", (req, res) => {
  if (!whoop.isConfigured()) {
    return res.status(400).json({ error: "Whoop integration is not configured (missing env vars)" });
  }
  const state = crypto.randomBytes(16).toString("hex");
  pendingStates.add(state);
  res.redirect(whoop.buildAuthorizeUrl(state));
});

router.get("/whoop/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.status(400).send(`Whoop authorization failed: ${error}`);
  if (!state || !pendingStates.has(state)) return res.status(400).send("Invalid or expired OAuth state");
  pendingStates.delete(state);

  try {
    const tokens = await whoop.exchangeCodeForTokens(code);
    await prisma.wearableConnection.upsert({
      where: { provider: "WHOOP" },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      create: {
        provider: "WHOOP",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
    res.redirect("/fitness?whoop=connected");
  } catch (err) {
    res.status(500).send(`Whoop connection failed: ${err.message}`);
  }
});

router.delete("/whoop/disconnect", async (req, res) => {
  await prisma.wearableConnection.deleteMany({ where: { provider: "WHOOP" } });
  res.status(204).end();
});

router.post("/whoop/sync", async (req, res) => {
  try {
    res.json(await syncWhoop());
  } catch (err) {
    sendSyncError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Garmin (Personal API key — no OAuth redirect; the key lives in an env var)
// ---------------------------------------------------------------------------

router.get("/garmin/status", async (req, res) => {
  const conn = await prisma.wearableConnection.findUnique({ where: { provider: "GARMIN" } });
  res.json({ configured: garmin.isConfigured(), lastSyncedAt: conn?.lastSyncedAt || null, lastError: getLastError("garmin") });
});

router.post("/garmin/sync", async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 180);
  try {
    res.json(await syncGarmin(days));
  } catch (err) {
    sendSyncError(res, err);
  }
});

router.get("/garmin/activities", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const recent = await prisma.garminActivity.findMany({ orderBy: { start: "desc" }, take: limit * 2 });

  // The Kickr/trainer apps record a second "virtual ride" alongside the watch's
  // indoor cycling activity. Drop an activity with no training load when
  // another one with a load started within 5 minutes — it's the same workout.
  const deduped = recent.filter(
    (a) =>
      a.trainingLoad != null ||
      !recent.some((b) => b.id !== a.id && b.trainingLoad != null && Math.abs(b.start - a.start) <= 5 * 60 * 1000)
  );
  res.json(deduped.slice(0, limit));
});

router.get("/whoop/workouts", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const workouts = await prisma.whoopWorkout.findMany({
    orderBy: { start: "desc" },
    take: limit,
  });
  res.json(workouts);
});

router.get("/metrics", async (req, res) => {
  const { start, end } = req.query;
  const where = {};
  if (start || end) {
    where.date = {};
    if (start) where.date.gte = new Date(start);
    if (end) where.date.lte = new Date(end);
  }
  const metrics = await prisma.dailyMetric.findMany({ where, orderBy: { date: "asc" } });
  res.json(metrics);
});

module.exports = router;
