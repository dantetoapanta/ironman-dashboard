import { estimateDurationMin } from "./recommendations";

const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function formatMinutes(mins) {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// Today's fixed busy intervals (class blocks) from the active schedule
// profile, sorted and normalized to minutes-from-midnight.
export function todaysClassBlocks(scheduleProfile) {
  if (!scheduleProfile?.blocks?.length) return [];
  const todayAbbr = DAY_ABBR[new Date().getDay()];
  return scheduleProfile.blocks
    .filter((b) => b.day === todayAbbr)
    .map((b) => ({ ...b, startMin: timeToMinutes(b.start), endMin: timeToMinutes(b.end) }))
    .sort((a, b) => a.startMin - b.startMin);
}

// Greedily places today's sessions (in their existing plan order) into the
// open gaps around fixed class blocks, starting as early as DAY_START and
// leaving a buffer between sessions for transition/shower/travel time.
const DAY_START_MIN = 5 * 60; // 5:00 AM
const DAY_END_MIN = 21.5 * 60; // 9:30 PM
const BUFFER_MIN = 20;

export function scheduleWorkouts(sessions, classBlocks) {
  let cursor = DAY_START_MIN;
  const results = [];

  for (const session of sessions) {
    if (session.discipline === "RACE") continue;
    const duration = estimateDurationMin(session);

    // Push past any class block that would overlap this session's window.
    let start = cursor;
    let conflict = classBlocks.find((b) => start < b.endMin && start + duration > b.startMin);
    while (conflict) {
      start = conflict.endMin + BUFFER_MIN;
      conflict = classBlocks.find((b) => start < b.endMin && start + duration > b.startMin);
    }

    results.push({
      session,
      startMin: start,
      endMin: start + duration,
      durationMin: duration,
      tooLate: start + duration > DAY_END_MIN,
    });
    cursor = start + duration + BUFFER_MIN;
  }

  return results;
}

// Merges scheduled workouts and class blocks into one chronological list for
// a single "here's your whole day" timeline.
export function buildDayTimeline(sessions, scheduleProfile) {
  const classBlocks = todaysClassBlocks(scheduleProfile);
  const scheduled = scheduleWorkouts(sessions, classBlocks);

  const items = [
    ...classBlocks.map((b) => ({ type: "class", startMin: b.startMin, endMin: b.endMin, label: b.label || "Class" })),
    ...scheduled.map((s) => ({ type: "workout", startMin: s.startMin, endMin: s.endMin, session: s.session, tooLate: s.tooLate })),
  ];
  items.sort((a, b) => a.startMin - b.startMin);
  return items;
}
