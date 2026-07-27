// All week/session/race dates are stored as UTC-midnight "calendar dates" (no
// real time-of-day meaning). Formatting them with the browser's local timezone
// can shift the displayed day by one when the viewer is behind UTC (e.g. US
// Eastern), so every display of a stored date must pin timeZone: "UTC".

export function fmtUTC(dateInput, options) {
  if (!dateInput) return "";
  return new Date(dateInput).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

// "Today" as YYYY-MM-DD in the viewer's real local calendar day (not UTC).
export function localTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Whole-day difference between a stored UTC-calendar-date and the viewer's
// real local today, comparing calendar days rather than raw instants.
export function calendarDaysUntil(dateInput) {
  const target = new Date(dateInput);
  const targetUTCms = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const now = new Date();
  const todayUTCms = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((targetUTCms - todayUTCms) / 86400000);
}

// Local-today expressed as a UTC-midnight Date, for range comparisons against
// stored UTC-midnight week/session boundaries.
export function localTodayAsUTCDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
