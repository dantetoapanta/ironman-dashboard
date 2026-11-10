const whoop = require("./whoop");
const garmin = require("./garmin");
const sync = require("./sync");

const FIRST_RUN_DELAY_MS = 30_000;
const CATCH_UP_DAYS = 30; // first run after a (re)deploy backfills any gap
const ROUTINE_DAYS = 3; // later runs only refresh today + recent days (late sleep/HRV)

let running = false;

const describeError = (err) => (err.detail && err.detail !== err.message ? `${err.message} (${err.detail})` : err.message);

async function runCycle(garminDays) {
  if (running) return;
  running = true;
  const started = Date.now();
  try {
    const parts = [];

    if (whoop.isConfigured() && (await sync.getWhoopConnection())) {
      try {
        const r = await sync.syncWhoop();
        parts.push(`whoop ${r.synced}d/${r.workoutsSynced}w`);
      } catch (err) {
        parts.push(`whoop FAILED: ${describeError(err)}`);
      }
    }

    if (garmin.isConfigured()) {
      try {
        const r = await sync.syncGarmin(garminDays);
        parts.push(`garmin ${r.synced}d/${r.activitiesSynced}a (${garminDays}d window)`);
      } catch (err) {
        parts.push(`garmin FAILED: ${describeError(err)}`);
      }
    }

    console.log(`[auto-sync] ${parts.join(" | ") || "nothing connected"} — ${Date.now() - started}ms`);
  } finally {
    running = false;
  }
}

function startAutoSync(minutes) {
  if (!(minutes > 0)) return;
  const onError = (err) => console.error("[auto-sync] cycle crashed:", err.message);
  console.log(`[auto-sync] enabled: every ${minutes} min, first run in ${FIRST_RUN_DELAY_MS / 1000}s`);
  setTimeout(() => runCycle(CATCH_UP_DAYS).catch(onError), FIRST_RUN_DELAY_MS);
  setInterval(() => runCycle(ROUTINE_DAYS).catch(onError), minutes * 60_000);
}

module.exports = { startAutoSync };
