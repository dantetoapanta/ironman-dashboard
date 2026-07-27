// Week/session dates are stored as UTC-midnight calendar dates. Comparing them
// against a raw `new Date()` instant would misattribute "today" near midnight
// in whatever timezone the process runs in (see process.env.TZ in index.js).
// This derives "today" from the server's local Y/M/D and re-expresses it as
// UTC midnight so it lines up correctly with stored dates.
function todayUTCMidnight() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

module.exports = { todayUTCMidnight };
