// Week/session dates are stored as UTC-midnight calendar dates. Comparing them
// against a raw `new Date()` instant would misattribute "today" near midnight
// in whatever timezone the process runs in (see process.env.TZ in index.js).
// This derives "today" from the server's local Y/M/D and re-expresses it as
// UTC midnight so it lines up correctly with stored dates.
function todayUTCMidnight() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// Converts any timestamp to the UTC-midnight representation of its calendar
// date in process.env.TZ (see index.js) — the same convention used for
// stored week/session dates. Used to bucket wearable API timestamps by day.
function toLocalDateKey(timestamp) {
  const d = new Date(timestamp);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.TZ || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  return new Date(`${y}-${m}-${day}T00:00:00.000Z`);
}

module.exports = { todayUTCMidnight, toLocalDateKey };
