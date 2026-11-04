const crypto = require("crypto");
const express = require("express");
const prisma = require("../lib/prisma");
const whoop = require("../lib/whoop");
const garmin = require("../lib/garmin");
const { toLocalDateKey, todayUTCMidnight } = require("../lib/dates");

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
    // Workouts need the read:workout scope, added after some users already
    // connected — don't let a missing-scope 401 break the rest of the sync.
    // If this happens, reconnect Whoop (disconnect + Connect Whoop again) to
    // re-authorize with the new scope.
    let workouts = { records: [] };
    let workoutScopeError = null;
    try {
      workouts = await whoop.getWorkouts(accessToken, { start, limit: 25 });
    } catch (err) {
      workoutScopeError = err.message;
    }

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

    let workoutCount = 0;
    for (const w of workouts.records || []) {
      if (w.score_state !== "SCORED" || !w.id || !w.start || !w.end) continue;
      const durationMin = Math.round((new Date(w.end) - new Date(w.start)) / 60000);
      await prisma.whoopWorkout.upsert({
        where: { whoopId: w.id },
        update: {
          sportName: w.sport_name ?? null,
          start: new Date(w.start),
          end: new Date(w.end),
          durationMin,
          strain: w.score?.strain ?? null,
          avgHr: w.score?.average_heart_rate ?? null,
          maxHr: w.score?.max_heart_rate ?? null,
          kilojoule: w.score?.kilojoule ?? null,
          distanceMeter: w.score?.distance_meter ?? null,
        },
        create: {
          whoopId: w.id,
          sportName: w.sport_name ?? null,
          start: new Date(w.start),
          end: new Date(w.end),
          durationMin,
          strain: w.score?.strain ?? null,
          avgHr: w.score?.average_heart_rate ?? null,
          maxHr: w.score?.max_heart_rate ?? null,
          kilojoule: w.score?.kilojoule ?? null,
          distanceMeter: w.score?.distance_meter ?? null,
        },
      });
      workoutCount++;
    }

    await prisma.wearableConnection.update({
      where: { provider: "WHOOP" },
      data: { lastSyncedAt: new Date() },
    });

    res.json({
      synced: count,
      workoutsSynced: workoutCount,
      workoutScopeError: workoutScopeError
        ? "Workouts didn't sync — reconnect Whoop (Disconnect, then Connect again) to grant the newer workout-read permission."
        : null,
    });
  } catch (err) {
    res.status(502).json({ error: "Whoop sync failed", detail: err.message });
  }
});

// ---------------------------------------------------------------------------
// Garmin (Personal API key — no OAuth redirect; the key lives in an env var)
// ---------------------------------------------------------------------------

// Garmin uses -1/-2 style sentinels for "no data" on some metrics.
const valid = (v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);
const round1 = (v) => (v === undefined ? undefined : Math.round(v * 10) / 10);
const dateKey = (calendarDate) => new Date(`${calendarDate}T00:00:00.000Z`);

router.get("/garmin/status", async (req, res) => {
  const conn = await prisma.wearableConnection.findUnique({ where: { provider: "GARMIN" } });
  res.json({ configured: garmin.isConfigured(), lastSyncedAt: conn?.lastSyncedAt || null });
});

router.post("/garmin/sync", async (req, res) => {
  if (!garmin.isConfigured()) return res.status(400).json({ error: "Garmin is not configured (GARMIN_PERSONAL_API_KEY is not set)" });

  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 180);
  const endDate = todayUTCMidnight().toISOString().slice(0, 10);
  const startDate = new Date(todayUTCMidnight().getTime() - days * 86400000).toISOString().slice(0, 10);

  try {
    const [daily, sleeps, hrvs, activities] = await Promise.all([
      garmin.getDailySummaries(startDate, endDate),
      garmin.getSleepSummaries(startDate, endDate),
      garmin.getHrvSummaries(startDate, endDate),
      garmin.getActivities(startDate, endDate),
    ]);

    // One DailyMetric row per calendar day; only set fields Garmin actually returned
    // so a missing value never wipes out something we already have.
    const byDate = new Map();
    const bucket = (calendarDate) => {
      if (!byDate.has(calendarDate)) byDate.set(calendarDate, {});
      return byDate.get(calendarDate);
    };

    for (const d of daily) {
      const b = bucket(d.calendarDate);
      b.garminSteps = valid(d.movement?.steps?.value);
      b.garminRestingHr = valid(d.heartRate?.restingValue);
      b.garminBodyBattery = valid(d.bodyBattery?.maxValue);
      b.garminStress = valid(d.stress?.avgLevel);
      b.garminCalories = valid(d.calories?.burnedTotal);
    }
    for (const s of sleeps) {
      const b = bucket(s.calendarDate);
      const sleepSec = valid(s.sleepTimeSeconds);
      b.garminSleepHours = sleepSec ? round1(sleepSec / 3600) : undefined;
      b.garminSleepScore = valid(s.sleepScores?.overall?.value);
    }
    for (const h of hrvs) {
      bucket(h.calendarDate).garminHrv = valid(h.lastNightAvg);
    }

    // Daily training load = sum of that day's per-activity loads (by the watch's local date).
    const loadByDate = new Map();
    for (const a of activities) {
      const load = valid(a.activityTrainingLoad);
      if (!load || !a.startTimeLocal) continue;
      const day = a.startTimeLocal.slice(0, 10);
      loadByDate.set(day, (loadByDate.get(day) || 0) + load);
    }
    for (const [day, load] of loadByDate) bucket(day).garminTrainingLoad = Math.round(load);

    let metricCount = 0;
    for (const [calendarDate, raw] of byDate) {
      const fields = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));
      if (Object.keys(fields).length === 0) continue;
      const date = dateKey(calendarDate);
      await prisma.dailyMetric.upsert({ where: { date }, update: fields, create: { date, ...fields } });
      metricCount++;
    }

    let activityCount = 0;
    for (const a of activities) {
      if (!a.activityId || !a.startTimeGMT) continue;
      const fields = {
        name: a.activityName ?? null,
        typeKey: a.activityType?.typeKey ?? null,
        start: new Date(`${a.startTimeGMT.replace(" ", "T")}Z`),
        startLocal: a.startTimeLocal ?? null,
        durationSec: a.duration ?? null,
        distanceMeter: a.distance ?? null,
        avgHr: a.averageHR ?? null,
        maxHr: a.maxHR ?? null,
        calories: a.calories ?? null,
        trainingLoad: a.activityTrainingLoad ?? null,
        aerobicEffect: a.aerobicTrainingEffect ?? null,
        anaerobicEffect: a.anaerobicTrainingEffect ?? null,
        avgPower: a.avgPower ?? null,
        elevationGainM: a.elevationGain ?? null,
      };
      await prisma.garminActivity.upsert({
        where: { garminId: String(a.activityId) },
        update: fields,
        create: { garminId: String(a.activityId), ...fields },
      });
      activityCount++;
    }

    // API-key provider: no OAuth tokens to store, this row only tracks sync time.
    await prisma.wearableConnection.upsert({
      where: { provider: "GARMIN" },
      update: { lastSyncedAt: new Date() },
      create: { provider: "GARMIN", accessToken: "n/a", refreshToken: "n/a", tokenExpiresAt: new Date(), lastSyncedAt: new Date() },
    });

    res.json({ synced: metricCount, activitiesSynced: activityCount, days });
  } catch (err) {
    const status = err instanceof garmin.GarminKeyError ? 401 : 502;
    res.status(status).json({ error: err instanceof garmin.GarminKeyError ? err.message : "Garmin sync failed", detail: err.message });
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
