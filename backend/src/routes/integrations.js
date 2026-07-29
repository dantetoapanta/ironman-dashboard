const crypto = require("crypto");
const express = require("express");
const prisma = require("../lib/prisma");
const whoop = require("../lib/whoop");
const { toLocalDateKey } = require("../lib/dates");
const { parseCsv } = require("../lib/csv");

const router = express.Router();

// In-memory OAuth state store (single-user app, short-lived, process-local is fine).
const pendingStates = new Set();

async function getWhoopConnection() {
  return prisma.wearableConnection.findUnique({ where: { provider: "WHOOP" } });
}

async function getValidWhoopAccessToken() {
  const conn = await getWhoopConnection();
  if (!conn) return null;
  if (new Date(conn.tokenExpiresAt) > new Date(Date.now() + 60_000)) {
    return conn.accessToken;
  }
  const tokens = await whoop.refreshTokens(conn.refreshToken);
  const updated = await prisma.wearableConnection.update({
    where: { provider: "WHOOP" },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || conn.refreshToken,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return updated.accessToken;
}

router.get("/whoop/status", async (req, res) => {
  const conn = await getWhoopConnection();
  res.json({
    configured: whoop.isConfigured(),
    connected: !!conn,
    lastSyncedAt: conn?.lastSyncedAt || null,
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
    const accessToken = await getValidWhoopAccessToken();
    if (!accessToken) return res.status(400).json({ error: "Whoop is not connected" });

    const start = new Date(Date.now() - 30 * 86400000).toISOString();
    const [recoveries, sleeps, cycles] = await Promise.all([
      whoop.getRecoveries(accessToken, { start, limit: 25 }),
      whoop.getSleeps(accessToken, { start, limit: 25 }),
      whoop.getCycles(accessToken, { start, limit: 25 }),
    ]);

    const byDate = new Map();
    const touch = (ts) => {
      const key = toLocalDateKey(ts);
      const k = key.toISOString();
      if (!byDate.has(k)) byDate.set(k, { date: key });
      return byDate.get(k);
    };

    for (const r of recoveries.records || []) {
      if (r.score_state !== "SCORED" || !r.created_at) continue;
      const bucket = touch(r.created_at);
      bucket.whoopRecoveryScore = r.score?.recovery_score ?? null;
      bucket.whoopHrvMilli = r.score?.hrv_rmssd_milli ?? null;
      bucket.whoopRestingHr = r.score?.resting_heart_rate ?? null;
    }
    for (const s of sleeps.records || []) {
      if (s.score_state !== "SCORED" || !s.start || !s.end) continue;
      const bucket = touch(s.start);
      bucket.whoopSleepScore = s.score?.sleep_performance_percentage ?? null;
      const hours = (new Date(s.end) - new Date(s.start)) / 3600000;
      bucket.whoopSleepHours = Math.round(hours * 10) / 10;
    }
    for (const c of cycles.records || []) {
      if (c.score_state !== "SCORED" || !c.start) continue;
      const bucket = touch(c.start);
      bucket.whoopStrain = c.score?.strain ?? null;
    }

    let count = 0;
    for (const metric of byDate.values()) {
      const { date, ...fields } = metric;
      await prisma.dailyMetric.upsert({
        where: { date },
        update: fields,
        create: { date, ...fields },
      });
      count++;
    }

    await prisma.wearableConnection.update({
      where: { provider: "WHOOP" },
      data: { lastSyncedAt: new Date() },
    });

    res.json({ synced: count });
  } catch (err) {
    res.status(502).json({ error: "Whoop sync failed", detail: err.message });
  }
});

// Garmin has no accessible personal-use API, so stats come from a manual CSV
// import instead of live sync. Expected headers (any subset is fine):
// date,steps,resting_hr,body_battery,training_load,sleep_hours,calories
router.post("/garmin/import", async (req, res) => {
  const { csv } = req.body;
  if (!csv || typeof csv !== "string") return res.status(400).json({ error: "csv (string) is required in the request body" });

  const rows = parseCsv(csv);
  if (rows.length === 0) return res.status(400).json({ error: "No data rows found in CSV" });

  const FIELD_MAP = {
    steps: "garminSteps",
    resting_hr: "garminRestingHr",
    body_battery: "garminBodyBattery",
    training_load: "garminTrainingLoad",
    sleep_hours: "garminSleepHours",
    calories: "garminCalories",
  };

  let count = 0;
  const errors = [];
  for (const row of rows) {
    if (!row.date) {
      errors.push("Row missing 'date' column");
      continue;
    }
    const parsedDate = new Date(row.date);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push(`Unparseable date: "${row.date}"`);
      continue;
    }
    const date = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));

    const fields = {};
    for (const [csvKey, dbKey] of Object.entries(FIELD_MAP)) {
      if (row[csvKey] !== undefined && row[csvKey] !== "") {
        const num = Number(row[csvKey]);
        if (!Number.isNaN(num)) fields[dbKey] = num;
      }
    }
    if (Object.keys(fields).length === 0) continue;

    await prisma.dailyMetric.upsert({
      where: { date },
      update: fields,
      create: { date, ...fields },
    });
    count++;
  }

  res.json({ imported: count, errors });
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
