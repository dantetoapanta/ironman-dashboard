/* eslint-disable no-console */
const prisma = require("../src/lib/prisma");

// ---------------------------------------------------------------------------
// Baselines (from athlete-provided data / Omaha 70.3 performance)
// ---------------------------------------------------------------------------
// FTP: no recent formal test -> Week 1 Tuesday session IS the test; 190W used
//      as the seed baseline (midpoint of stated 180-200W range) and nudged up
//      phase-by-phase to reflect expected training gains.
// Swim threshold: 1:45/100y, consistent with a 40:00 1.2mi swim at Omaha.
// Run paces: derived from 18:50 5K / 3:06 marathon (~VDOT 53).
// Strength maxes: squat 300, deadlift 315, RDL ~205x reps, bench 200.

const BASE_MONDAY = Date.UTC(2026, 6, 20); // Mon Jul 20, 2026 (month is 0-indexed)
const DAY_MS = 24 * 60 * 60 * 1000;

function dateFor(weekNumber, dayOffsetFromMonday) {
  return new Date(BASE_MONDAY + (weekNumber - 1) * 7 * DAY_MS + dayOffsetFromMonday * DAY_MS);
}

// dayOffsetFromMonday: MON=0, TUE=1, WED=2, THU=3, FRI=4, SAT=5, SUN=6
const DOW = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0 };
const OFFSET = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6 };

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------
const PHASES = [
  {
    order: 1,
    name: "Reconstruction",
    startWeek: 1,
    endWeek: 3,
    description:
      "Re-establish aerobic base and movement quality after post-Omaha detraining. Lower volume, higher frequency, technique-first. Week 1 includes the block's baseline FTP test.",
  },
  {
    order: 2,
    name: "Base",
    startWeek: 4,
    endWeek: 9,
    description:
      "Build aerobic volume across all three disciplines with progressive overload and a scheduled recovery week (Week 7). Structured FTP intervals and a weekly tempo run are introduced.",
  },
  {
    order: 3,
    name: "Build",
    startWeek: 10,
    endWeek: 15,
    description:
      "Race-specific intensity and volume. Run climbs toward a 60mi/week peak with a 16mi long-run cap (deliberately short of 18-20mi to protect against overuse). Bike builds toward 115-120mi/week, including a 65-70mi overdistance ride in Week 14. Includes a Week 12 recovery week.",
  },
  {
    order: 4,
    name: "Peak",
    startWeek: 16,
    endWeek: 18,
    description:
      "Sharpening and race simulation: race-pace intervals, brick workouts, and a half-distance dress rehearsal, while overall volume eases back from the Build-phase peak.",
  },
  {
    order: 5,
    name: "Taper",
    startWeek: 19,
    endWeek: 21,
    description:
      "Progressive load reduction into race day (Sun, Dec 13, 2026) while retaining frequency and short intensity touches to stay sharp. Week 21 is race week.",
  },
];

function phaseForWeek(wk) {
  return PHASES.find((p) => wk >= p.startWeek && wk <= p.endWeek);
}

// ---------------------------------------------------------------------------
// Weekly volume targets (21 rows) — run/bike in miles, swim in yards
// ---------------------------------------------------------------------------
const WEEK_PLAN = [
  { wk: 1, runMi: 18, longRunMi: 6, bikeMi: 55, longRideMi: 20, swimYd: 4500, cutback: false, focus: "Reconstruction begins — baseline FTP test on the bike, easy aerobic running, swim technique reset." },
  { wk: 2, runMi: 21, longRunMi: 7, bikeMi: 60, longRideMi: 22, swimYd: 5000, cutback: false, focus: "Build session frequency while keeping intensity low; movement-quality strength work." },
  { wk: 3, runMi: 24, longRunMi: 8, bikeMi: 65, longRideMi: 24, swimYd: 5500, cutback: false, focus: "Final reconstruction week — small volume bump before Base phase begins." },
  { wk: 4, runMi: 28, longRunMi: 9, bikeMi: 70, longRideMi: 28, swimYd: 6000, cutback: false, focus: "Base phase begins — first full structured FTP intervals, tempo run introduced." },
  { wk: 5, runMi: 31, longRunMi: 10, bikeMi: 75, longRideMi: 30, swimYd: 6500, cutback: false, focus: "Progressive overload continues across all three disciplines." },
  { wk: 6, runMi: 34, longRunMi: 11, bikeMi: 80, longRideMi: 32, swimYd: 7000, cutback: false, focus: "Third straight loading week — monitor fatigue heading into the recovery week." },
  { wk: 7, runMi: 26, longRunMi: 9, bikeMi: 65, longRideMi: 26, swimYd: 6000, cutback: true, focus: "Recovery week — reduced volume to absorb Base-phase load. Same structure, less of it." },
  { wk: 8, runMi: 37, longRunMi: 12, bikeMi: 85, longRideMi: 34, swimYd: 7500, cutback: false, focus: "Back to loading — volume above the pre-recovery peak." },
  { wk: 9, runMi: 40, longRunMi: 13, bikeMi: 90, longRideMi: 36, swimYd: 8000, cutback: false, focus: "Final Base week — heaviest aerobic volume before Build-phase intensity rises. Good week for fitness re-tests." },
  { wk: 10, runMi: 48, longRunMi: 13, bikeMi: 92, longRideMi: 38, swimYd: 8000, cutback: false, focus: "Build phase begins — race-specific intensity layers onto the aerobic base." },
  { wk: 11, runMi: 52, longRunMi: 14, bikeMi: 98, longRideMi: 42, swimYd: 8500, cutback: false, focus: "Second Build loading week — quality sessions get harder, not just longer." },
  { wk: 12, runMi: 40, longRunMi: 11, bikeMi: 78, longRideMi: 32, swimYd: 7000, cutback: true, focus: "Recovery week within Build — absorb the load before the two biggest weeks of the block." },
  { wk: 13, runMi: 56, longRunMi: 15, bikeMi: 106, longRideMi: 46, swimYd: 9000, cutback: false, focus: "Loading resumes hard — long run and long ride both push toward their Build-phase caps." },
  { wk: 14, runMi: 50, longRunMi: 12, bikeMi: 118, longRideMi: 68, swimYd: 9000, cutback: false, focus: "Overdistance bike week — 65-70mi Sunday ride, the single biggest session of the block. Long run trimmed to manage combined load." },
  { wk: 15, runMi: 60, longRunMi: 16, bikeMi: 100, longRideMi: 40, swimYd: 8500, cutback: false, focus: "Build phase closes — run mileage peaks at 60mi/week with the 16mi long-run cap. Bike eases as Peak phase approaches." },
  { wk: 16, runMi: 50, longRunMi: 13, bikeMi: 90, longRideMi: 32, swimYd: 8500, cutback: false, focus: "Peak phase begins — race-simulation brick work, sharpening intensity, volume eases from the Build peak." },
  { wk: 17, runMi: 46, longRunMi: 12, bikeMi: 85, longRideMi: 30, swimYd: 8000, cutback: false, focus: "Race-pace tuning — half-distance dress-rehearsal brick session this week." },
  { wk: 18, runMi: 42, longRunMi: 11, bikeMi: 80, longRideMi: 28, swimYd: 7500, cutback: false, focus: "Final Peak week — last big quality touches before the taper begins." },
  { wk: 19, runMi: 32, longRunMi: 9, bikeMi: 60, longRideMi: 22, swimYd: 6000, cutback: false, focus: "Taper begins — volume drops roughly 30-40%; frequency and intensity touches are preserved to stay sharp." },
  { wk: 20, runMi: 24, longRunMi: 7, bikeMi: 45, longRideMi: 16, swimYd: 5000, cutback: false, focus: "Deep taper — volume down further, short race-pace reminders only, dial in race logistics." },
  { wk: 21, runMi: 12, longRunMi: 4, bikeMi: 25, longRideMi: 0, swimYd: 3000, cutback: false, focus: "Race week — minimal volume, travel to Haines City, gear/bike check, and race day: IRONMAN 70.3 FLORIDA." },
];

// ---------------------------------------------------------------------------
// Fitness baselines that scale by week
// ---------------------------------------------------------------------------
function ftpForWeek(wk) {
  if (wk <= 3) return 190; // Reconstruction — pending Week 1 test
  if (wk <= 6) return 195;
  if (wk <= 9) return 200;
  if (wk <= 12) return 205;
  if (wk <= 15) return 210;
  if (wk <= 18) return 215;
  return 215; // Taper — maintain, not build
}

function swimPaceForWeek(wk) {
  if (wk <= 9) return "1:45/100y"; // Reconstruction + Base
  if (wk <= 15) return "1:42/100y"; // Build
  return "1:40/100y"; // Peak + Taper
}

function runPacesForWeek(wk) {
  const sharp = wk >= 10; // Build/Peak/Taper — slightly tighter quality paces
  return {
    easy: "7:45-8:15/mi",
    long: "7:30-8:00/mi",
    marathonEffort: "7:00-7:10/mi",
    tempo: sharp ? "6:05-6:15/mi" : "6:15-6:25/mi",
    interval: sharp ? "5:40-5:50/mi" : "5:50-6:00/mi",
  };
}

// Strength load tables (lb), keyed by phase order, from stated maxes:
// squat 300 / deadlift 315 / RDL ~205x-for-reps / bench 200
const STRENGTH_TABLE = {
  1: { squat: "165-175 (~55-58%)", deadlift: "170-180 (~55-57%)", rdl: "135-145", bench: "110-120 (~55-60%)", incline: "95-105", scheme: "3x10", note: "Movement quality over load — full range of motion, controlled tempo." },
  2: { squat: "195-210 (~65-70%)", deadlift: "205-220 (~65-70%)", rdl: "165-175", bench: "130-140 (~65-70%)", incline: "115-125", scheme: "4x8", note: "Base strength-endurance block." },
  3: { squat: "225-240 (~75-80%)", deadlift: "235-250 (~75-79%)", rdl: "195-205", bench: "150-160 (~75-80%)", incline: "130-140", scheme: "4x5", note: "Max-strength phase — full recovery between sets." },
  4: { squat: "245-255 (~82-85%)", deadlift: "260-270 (~83-86%)", rdl: "205-215", bench: "165-175 (~83-88%)", incline: "140-150", scheme: "3x3-4", note: "Peak power, low volume — protect leg freshness for run/bike quality days." },
  5: { squat: "195-210 (~65-70%)", deadlift: "205-220 (~65-70%)", rdl: "165-175", bench: "130-140 (~65-70%)", incline: "115-125", scheme: "2x3", note: "Maintenance only — keep the movement pattern, shed fatigue. Off entirely race week." },
};

function j(obj) {
  return JSON.stringify(obj);
}

// ---------------------------------------------------------------------------
// Session builders
// ---------------------------------------------------------------------------

function mondayLift(wk, phaseOrder) {
  const s = STRENGTH_TABLE[phaseOrder];
  const exercises = [
    { name: "Back Squat", scheme: s.scheme, load: `${s.squat} lb` },
    { name: "Deadlift", scheme: s.scheme, load: `${s.deadlift} lb` },
    { name: "Romanian Deadlift (RDL)", scheme: "3x8", load: `${s.rdl} lb` },
    { name: "Bulgarian Split Squat", scheme: "3x8-10/leg", load: "moderate DB, controlled tempo" },
    { name: "Hang Clean", scheme: "5x3", load: "light-moderate, technical focus" },
    { name: "Calf Raises", scheme: "3x15-20", load: "bodyweight or loaded" },
  ];
  return {
    title: "Lower Body / Power",
    description: `${s.note} Back squat & deadlift ${s.scheme} @ ${s.squat.split(" ")[0]}lb / ${s.deadlift.split(" ")[0]}lb respectively.`,
    details: j({ exercises }),
    durationMin: phaseOrder === 5 && wk === 21 ? null : 60,
  };
}

function fridayLift(wk, phaseOrder) {
  const s = STRENGTH_TABLE[phaseOrder];
  const exercises = [
    { name: "Bench Press", scheme: s.scheme, load: `${s.bench} lb` },
    { name: "Incline Bench Press", scheme: s.scheme, load: `${s.incline} lb` },
    { name: "Lat Pulldown", scheme: "4x10", load: "moderate" },
    { name: "Face Pulls", scheme: "3x15", load: "light band/cable" },
    { name: "Pallof Press", scheme: "3x12/side", load: "moderate band/cable" },
    { name: "Plank", scheme: "3x45-60s", load: "bodyweight" },
  ];
  return {
    title: "Upper Body / Swim-Specific / Core",
    description: `${s.note} Bench & incline ${s.scheme} @ ${s.bench.split(" ")[0]}lb / ${s.incline.split(" ")[0]}lb. Core + rotator/scap work supports swim catch mechanics.`,
    details: j({ exercises }),
    durationMin: 50,
  };
}

function tuesdayBike(wk) {
  const ftp = ftpForWeek(wk);
  if (wk === 1) {
    return {
      title: "FTP Test",
      description: "15min progressive warm-up, then a 20min all-out effort (avg power x0.95 = estimated FTP). Log the result in Fitness Tests immediately after.",
      details: j({ ftpTarget: ftp, structure: [
        { label: "Warm-up", duration: "15min", intensity: "Z1-Z2, building" },
        { label: "FTP Test", duration: "20min", intensity: "All-out sustainable effort" },
        { label: "Cool-down", duration: "10min", intensity: "Z1 easy spin" },
      ] }),
      durationMin: 45,
    };
  }
  if (wk === 2) {
    return {
      title: "2x20min Building Intervals",
      description: `2x20min @ 90-95% FTP (~${Math.round(ftp * 0.9)}-${Math.round(ftp * 0.95)}W), 5min easy spin between. Reintroducing sustained threshold work.`,
      details: j({ ftpTarget: ftp, structure: [
        { label: "Warm-up", duration: "10min", intensity: "Z1-Z2" },
        { label: "Interval 1", duration: "20min", intensity: `90-95% FTP (${Math.round(ftp * 0.9)}-${Math.round(ftp * 0.95)}W)` },
        { label: "Recovery", duration: "5min", intensity: "Z1 easy spin" },
        { label: "Interval 2", duration: "20min", intensity: `90-95% FTP (${Math.round(ftp * 0.9)}-${Math.round(ftp * 0.95)}W)` },
        { label: "Cool-down", duration: "10min", intensity: "Z1 easy spin" },
      ] }),
      durationMin: 70,
    };
  }
  if (wk >= 19) {
    const reps = wk === 21 ? 3 : wk === 20 ? 2 : 3;
    const dur = wk === 21 ? 3 : wk === 20 ? 12 : 15;
    return {
      title: wk === 21 ? "Openers — Race Power Touches" : `${reps}x${dur}min @ FTP`,
      description: wk === 21
        ? `20min easy spin with 3x3min @ race power (${Math.round(ftp * 0.78)}-${Math.round(ftp * 0.82)}W) to stay sharp without fatigue.`
        : `Taper volume: ${reps}x${dur}min @ FTP (${ftp}W), full recovery between. Frequency maintained, duration cut.`,
      details: j({ ftpTarget: ftp, structure: [
        { label: "Warm-up", duration: "10min", intensity: "Z1-Z2" },
        { label: `${reps}x${dur}min`, duration: `${reps}x${dur}min`, intensity: wk === 21 ? `Race power (${Math.round(ftp * 0.78)}-${Math.round(ftp * 0.82)}W)` : `100% FTP (${ftp}W)` },
        { label: "Cool-down", duration: "10min", intensity: "Z1 easy spin" },
      ] }),
      durationMin: wk === 21 ? 30 : 55,
    };
  }
  // Standard Base/Build/Peak signature session
  const intensity = wk >= 16 ? `${ftp}-${Math.round(ftp * 1.05)}W (100-105% FTP)` : `${ftp}W (100% FTP)`;
  return {
    title: "3x25min @ FTP",
    description: `3x25min @ ${intensity}, 5min easy spin recovery between reps. The standing Tuesday threshold session for the block.`,
    details: j({ ftpTarget: ftp, structure: [
      { label: "Warm-up", duration: "10min", intensity: "Z1-Z2, building" },
      { label: "Interval 1", duration: "25min", intensity },
      { label: "Recovery", duration: "5min", intensity: "Z1 easy spin" },
      { label: "Interval 2", duration: "25min", intensity },
      { label: "Recovery", duration: "5min", intensity: "Z1 easy spin" },
      { label: "Interval 3", duration: "25min", intensity },
      { label: "Cool-down", duration: "10min", intensity: "Z1 easy spin" },
    ] }),
    durationMin: 105,
  };
}

function fridayBike(wk, phaseOrder) {
  if (wk === 21) return null; // no Friday bike race week
  const durMin = phaseOrder === 1 ? 60 : phaseOrder === 2 ? 65 : phaseOrder === 3 ? 75 : phaseOrder === 4 ? 75 : 45;
  const ftp = ftpForWeek(wk);
  const surge = phaseOrder >= 3 ? ` with 3x5min @ race power (${Math.round(ftp * 0.78)}-${Math.round(ftp * 0.82)}W) worked in` : "";
  return {
    title: `${durMin}min Aerobic Endurance`,
    description: `${durMin}min Z2 aerobic ride${surge}. Steady spin, nutrition/hydration practice for race-day sodium strategy (500-700mg/hr).`,
    details: j({ ftpTarget: ftp, structure: [
      { label: "Aerobic ride", duration: `${durMin}min`, intensity: "Z2 (65-75% FTP)" },
      ...(phaseOrder >= 3 ? [{ label: "Race-power surges", duration: "3x5min", intensity: `${Math.round(ftp * 0.78)}-${Math.round(ftp * 0.82)}W` }] : []),
    ] }),
    durationMin: durMin,
  };
}

function mondayBikeSpin(wk, phaseOrder) {
  if (wk === 21) return null;
  const durMin = phaseOrder === 5 ? 25 : 35;
  return {
    title: "Easy Recovery Spin",
    description: `${durMin}min very easy Z1 spin — legs-only recovery after the AM lift, no structure.`,
    details: j({ structure: [{ label: "Easy spin", duration: `${durMin}min`, intensity: "Z1, conversational" }] }),
    durationMin: durMin,
  };
}

function thursdayBikeEndurance(wk, phaseOrder) {
  const durMin = phaseOrder === 1 ? 45 : phaseOrder === 2 ? 60 : phaseOrder === 3 ? 75 : phaseOrder === 4 ? 60 : 40;
  return {
    title: "Moderate Endurance Ride",
    description: `${durMin}min Z2 ride, steady effort. Secondary aerobic volume builder, easy on the legs ahead of Friday's session.`,
    details: j({ structure: [{ label: "Endurance ride", duration: `${durMin}min`, intensity: "Z2 (65-75% FTP)" }] }),
    durationMin: durMin,
  };
}

function sundayBike(wk, phaseOrder, plan) {
  const ftp = ftpForWeek(wk);
  const raceWatt = `${Math.round(ftp * 0.75)}-${Math.round(ftp * 0.8)}W`;
  if (wk === 21) return null; // race day itself
  let raceBlocks = "";
  let structure = [{ label: "Long ride", duration: `${plan.longRideMi}mi`, intensity: "Z2 aerobic" }];
  if (phaseOrder === 3) {
    raceBlocks = ` including 2x20min @ race power (${raceWatt})`;
    structure.push({ label: "Race-power blocks", duration: "2x20min", intensity: raceWatt });
  } else if (phaseOrder === 4) {
    raceBlocks = ` with a 60-90min continuous block @ race power (${raceWatt}) simulating race pacing`;
    structure.push({ label: "Race simulation block", duration: "60-90min", intensity: raceWatt });
  } else if (phaseOrder === 5) {
    raceBlocks = ` with 3x10min @ race power (${raceWatt}) to keep race legs sharp`;
    structure.push({ label: "Race-power reminders", duration: "3x10min", intensity: raceWatt });
  }
  const overdistance = wk === 14 ? " — the block's overdistance ride (65-70mi)." : ".";
  return {
    title: `${plan.longRideMi}mi Long Ride`,
    description: `${plan.longRideMi}mi Z2 aerobic long ride${raceBlocks}${overdistance} Practice race nutrition: 500-700mg sodium/hour, not extra carbs.`,
    details: j({ ftpTarget: ftp, structure }),
    distanceMi: plan.longRideMi,
    durationMin: null,
  };
}

function mondayRun(wk, paces) {
  const mi = 3 + Math.floor((wk % 4));
  return {
    title: "Easy Run",
    description: `${mi}-${mi + 1}mi easy @ ${paces.easy}. Conversational effort, absorbs freed-up mileage.`,
    details: j({ paceZone: "easy", targetPace: paces.easy }),
    distanceMi: mi + 0.5,
  };
}

function tuesdayRun(wk, paces) {
  const mi = 3 + Math.floor((wk % 3));
  return {
    title: "Easy Run",
    description: `${mi}-${mi + 1}mi easy @ ${paces.easy}. Second easy day of the week — keep it truly easy ahead of the Tuesday bike threshold session.`,
    details: j({ paceZone: "easy", targetPace: paces.easy }),
    distanceMi: mi + 0.5,
  };
}

function wednesdayRun(wk, phaseOrder, paces) {
  if (phaseOrder === 1) {
    return {
      title: "Strides + Easy",
      description: `4mi easy @ ${paces.easy} with 6x20sec strides @ mile-race effort (full recovery). Reintroducing turnover without hard aerobic stress.`,
      details: j({ paceZone: "easy", targetPace: paces.easy, strides: "6x20sec @ mile effort" }),
      distanceMi: 4.5,
    };
  }
  if (phaseOrder === 5) {
    return {
      title: "Short Tempo Reminder",
      description: `2mi warm-up @ ${paces.easy}, 15min @ tempo (${paces.tempo}), 1mi cool-down. Short and sharp — taper volume, not taper intensity.`,
      details: j({ paceZone: "tempo", warmupMi: 2, mainSet: `15min @ ${paces.tempo}`, targetPace: paces.tempo }),
      distanceMi: 6,
    };
  }
  const tempoMin = phaseOrder === 2 ? 25 : phaseOrder === 3 ? 30 : 25;
  return {
    title: "Tempo Run",
    description: `2mi warm-up @ ${paces.easy}, ${tempoMin}min continuous @ threshold (${paces.tempo}), 1mi cool-down.`,
    details: j({ paceZone: "tempo", warmupMi: 2, mainSet: `${tempoMin}min @ ${paces.tempo}`, targetPace: paces.tempo }),
    distanceMi: 6 + Math.round(tempoMin / 8),
  };
}

function thursdayRun(wk, phaseOrder, paces) {
  if (phaseOrder === 3 || phaseOrder === 4) {
    const reps = phaseOrder === 3 ? 6 : 5;
    return {
      title: `${reps}x800m Intervals`,
      description: `2mi warm-up @ ${paces.easy}, ${reps}x800m @ interval pace (${paces.interval}) w/ 400m jog recovery, 1mi cool-down.`,
      details: j({ paceZone: "interval", warmupMi: 2, mainSet: `${reps}x800m @ ${paces.interval}, 400m jog recovery`, targetPace: paces.interval }),
      distanceMi: 6,
    };
  }
  return {
    title: "Easy Run",
    description: `4-5mi easy @ ${paces.easy}. Recovery-focused between Wednesday's tempo and Saturday's long run.`,
    details: j({ paceZone: "easy", targetPace: paces.easy }),
    distanceMi: 4.5,
  };
}

function saturdayRun(wk, phaseOrder, paces, plan) {
  let mainSet = `${plan.longRunMi}mi @ long-run pace (${paces.long})`;
  if (phaseOrder === 3 && wk >= 13) {
    mainSet = `${plan.longRunMi}mi @ ${paces.long}, last 3-4mi @ marathon effort (${paces.marathonEffort})`;
  } else if (phaseOrder === 4) {
    mainSet = `${plan.longRunMi}mi @ ${paces.long}, middle 4-5mi @ marathon effort (${paces.marathonEffort})`;
  }
  return {
    title: `${plan.longRunMi}mi Long Run`,
    description: `${mainSet}. Practice race-day fueling on the run.`,
    details: j({ paceZone: "long", targetPace: paces.long, distanceMi: plan.longRunMi }),
    distanceMi: plan.longRunMi,
  };
}

function sundayRunBrick(wk, paces) {
  if (wk === 21) return null;
  return {
    title: "Brick Run",
    description: `10-15min easy jog off the bike @ ${paces.easy}. Legs-under-fatigue transition practice — this is what race day actually feels like.`,
    details: j({ paceZone: "easy", targetPace: paces.easy, brick: true }),
    durationMin: 12,
  };
}

function swimSession(dayLabel, wk, phaseOrder, pace) {
  const yards = { WED: 2500, SAT: 1800, SUN: 2800 }[dayLabel];
  if (dayLabel === "WED") {
    const mainYards = phaseOrder <= 2 ? "10x100y @ threshold pace, 15sec rest" : phaseOrder === 3 || phaseOrder === 4 ? "6x200y @ threshold pace, 20sec rest" : "8x100y @ threshold pace, 20sec rest";
    return {
      title: "Threshold Set",
      description: `400y warm-up, ${mainYards} (${pace}), 200y cool-down.`,
      details: j({ warmupYd: 400, mainSet: `${mainYards} @ ${pace}`, cooldownYd: 200, totalYards: yards }),
      distanceMi: null,
    };
  }
  if (dayLabel === "SAT") {
    return {
      title: "Short Aerobic Swim",
      description: `300y warm-up, 1000y continuous aerobic, 500y cool-down w/ drills. Kept short — long run is the priority today.`,
      details: j({ warmupYd: 300, mainSet: "1000y continuous aerobic", cooldownYd: 500, totalYards: yards }),
      distanceMi: null,
    };
  }
  // SUN — pool or open water option
  const raceSet = phaseOrder >= 3 ? "1200y continuous @ race effort, sighting practice every 4th length" : "1000y continuous aerobic";
  return {
    title: "Pool or Open Water — Race-Effort Swim",
    description: `400y warm-up, ${raceSet}, 200y cool-down. Open water preferred when available for sighting/drafting practice.`,
    details: j({ warmupYd: 400, mainSet: raceSet, cooldownYd: 200, totalYards: yards, openWaterOption: true }),
    distanceMi: null,
  };
}

// ---------------------------------------------------------------------------
// Main seed routine
// ---------------------------------------------------------------------------
async function main() {
  const existingWeeks = await prisma.week.count();
  if (existingWeeks > 0 && !process.argv.includes("--force")) {
    console.log(
      `Database already has ${existingWeeks} weeks. Refusing to reseed — this would wipe all completion history and logged fitness tests. Pass --force to override.`
    );
    process.exit(1);
  }

  console.log("Clearing existing data...");
  await prisma.completion.deleteMany();
  await prisma.session.deleteMany();
  await prisma.week.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.fitnessTest.deleteMany();
  await prisma.scheduleProfile.deleteMany();
  await prisma.gearItem.deleteMany();
  await prisma.raceProfile.deleteMany();
  await prisma.raceMorningEvent.deleteMany();

  console.log("Seeding phases...");
  const phaseRecords = {};
  for (const p of PHASES) {
    const rec = await prisma.phase.create({ data: p });
    phaseRecords[p.order] = rec;
  }

  console.log("Seeding 21 weeks + sessions...");
  for (const plan of WEEK_PLAN) {
    const wk = plan.wk;
    const phase = phaseForWeek(wk);
    const paces = runPacesForWeek(wk);
    const swimPace = swimPaceForWeek(wk);

    const week = await prisma.week.create({
      data: {
        weekNumber: wk,
        startDate: dateFor(wk, OFFSET.MON),
        endDate: dateFor(wk, OFFSET.SUN),
        phaseId: phaseRecords[phase.order].id,
        runMileage: plan.runMi,
        bikeMileage: plan.bikeMi,
        swimYards: plan.swimYd,
        focus: plan.focus,
      },
    });

    const sessions = [];
    const push = (dayLabel, discipline, order, built) => {
      if (!built) return;
      sessions.push({
        weekId: week.id,
        date: dateFor(wk, OFFSET[dayLabel]),
        dayOfWeek: DOW[dayLabel],
        discipline,
        order,
        title: built.title,
        description: built.description,
        details: built.details || null,
        durationMin: built.durationMin ?? null,
        distanceMi: built.distanceMi ?? null,
      });
    };

    if (wk === 21) {
      // Race week — light openers Mon-Sat, race itself on Sunday
      push("MON", "LIFT", 1, { title: "Optional Light Mobility", description: "20min easy mobility/activation only. No loaded lifting this week.", durationMin: 20 });
      push("MON", "RUN", 2, mondayRun(wk, paces));
      push("TUE", "BIKE", 1, tuesdayBike(wk));
      push("TUE", "RUN", 2, { title: "Shakeout Run", description: `2mi easy @ ${paces.easy} with 4x20sec strides.`, distanceMi: 2, details: j({ paceZone: "easy", targetPace: paces.easy }) });
      push("WED", "SWIM", 1, { title: "Openers Swim", description: "800y easy w/ 6x50y @ race effort, 20sec rest.", details: j({ mainSet: "800y easy + 6x50y @ race effort" }) });
      push("WED", "RUN", 2, { title: "Easy Shakeout", description: `2mi easy @ ${paces.easy}.`, distanceMi: 2, details: j({ paceZone: "easy", targetPace: paces.easy }) });
      push("THU", "BIKE", 1, { title: "Travel Day / Rest", description: "Rest or 20min easy spin if traveling allows. Focus on logistics: bike box/case, gear check.", durationMin: 20 });
      push("FRI", "SWIM", 1, { title: "Pre-Race Openers", description: "600y easy with a few 25y race-effort pickups. Arrive at venue, rack bike if permitted.", details: j({ mainSet: "600y easy + pickups" }) });
      push("SAT", "RUN", 1, { title: "Shakeout Jog", description: `10-15min very easy jog @ ${paces.easy} with a couple of strides. Gear check, lay out race-morning kit, review nutrition/sodium plan.`, durationMin: 12 });
      push("SUN", "RACE", 1, {
        title: "IRONMAN 70.3 FLORIDA — RACE DAY",
        description: "1.2mi swim / 56mi bike / 13.1mi run. Bike nutrition target: 500-700mg sodium/hour (the Omaha lesson — this was a sodium deficiency, not a carb deficiency). See the Race Morning Timeline and Race Profile for the full plan.",
        durationMin: null,
      });
    } else {
      // Standard 16-session week
      push("MON", "LIFT", 1, mondayLift(wk, phase.order));
      push("MON", "BIKE", 2, mondayBikeSpin(wk, phase.order));
      push("MON", "RUN", 3, mondayRun(wk, paces));

      push("TUE", "BIKE", 1, tuesdayBike(wk));
      push("TUE", "RUN", 2, tuesdayRun(wk, paces));

      push("WED", "SWIM", 1, swimSession("WED", wk, phase.order, swimPace));
      push("WED", "RUN", 2, wednesdayRun(wk, phase.order, paces));

      push("THU", "BIKE", 1, thursdayBikeEndurance(wk, phase.order));
      push("THU", "RUN", 2, thursdayRun(wk, phase.order, paces));

      push("FRI", "LIFT", 1, fridayLift(wk, phase.order));
      push("FRI", "BIKE", 2, fridayBike(wk, phase.order));

      push("SAT", "RUN", 1, saturdayRun(wk, phase.order, paces, plan));
      push("SAT", "SWIM", 2, swimSession("SAT", wk, phase.order, swimPace));

      push("SUN", "BIKE", 1, sundayBike(wk, phase.order, plan));
      push("SUN", "SWIM", 2, swimSession("SUN", wk, phase.order, swimPace));
      push("SUN", "RUN", 3, sundayRunBrick(wk, paces));
    }

    for (const s of sessions) {
      await prisma.session.create({ data: s });
    }
  }

  console.log("Seeding schedule profiles...");
  await prisma.scheduleProfile.create({
    data: {
      name: "Summer/Break",
      active: true,
      startDate: new Date(Date.UTC(2026, 6, 20)),
      endDate: new Date(Date.UTC(2026, 7, 23)),
      blocks: j([]),
    },
  });
  await prisma.scheduleProfile.create({
    data: {
      name: "School Year",
      active: false,
      startDate: new Date(Date.UTC(2026, 7, 24)),
      endDate: new Date(Date.UTC(2026, 11, 13)),
      blocks: j([
        { day: "TUE", start: "08:00", end: "11:50", label: "Class block" },
        { day: "TUE", start: "14:00", end: "15:50", label: "Class block" },
        { day: "THU", start: "08:00", end: "11:50", label: "Class block" },
        { day: "THU", start: "14:00", end: "15:50", label: "Class block" },
        { day: "FRI", start: "10:00", end: "13:50", label: "Class block" },
      ]),
    },
  });

  console.log("Seeding gear checklist...");
  const gear = [
    ["Swim", "Wetsuit", 0],
    ["Swim", "Goggles (+ backup pair)", 1],
    ["Swim", "Swim cap (own, in addition to event-provided)", 2],
    ["Swim", "Anti-chafe balm (BodyGlide)", 3],
    ["Bike", "Bike, serviced/tuned", 0],
    ["Bike", "Helmet", 1],
    ["Bike", "Bike shoes", 2],
    ["Bike", "Sunglasses", 3],
    ["Bike", "Race belt + race number", 4],
    ["Bike", "Bike computer/GPS watch, charged", 5],
    ["Bike", "Spare tubes x2 + CO2/inflator", 6],
    ["Bike", "Multi-tool", 7],
    ["Bike", "Water bottles (2-3, pre-filled)", 8],
    ["Run", "Run shoes", 0],
    ["Run", "Race hat/visor", 1],
    ["Run", "Socks (bike + run pairs)", 2],
    ["Nutrition", "Sodium tabs — target 500-700mg/hour on bike", 0],
    ["Nutrition", "Carb gels/chews (per-hour race plan)", 1],
    ["Nutrition", "Electrolyte drink mix", 2],
    ["Nutrition", "Pre-race breakfast (banana, bagel, familiar food)", 3],
    ["Morning-Of", "Sunscreen", 0],
    ["Morning-Of", "Body Glide (full body)", 1],
    ["Morning-Of", "Timing chip + strap", 2],
    ["Morning-Of", "Extra warm layer for pre-race wait", 3],
    ["Morning-Of", "Morning clothes bag", 4],
    ["Bags/Docs", "Photo ID", 0],
    ["Bags/Docs", "Race confirmation / printed emails", 1],
    ["Bags/Docs", "Cash/card", 2],
    ["Bags/Docs", "Labeled bike + gear bags", 3],
  ];
  for (const [category, name, order] of gear) {
    await prisma.gearItem.create({ data: { category, name, order } });
  }

  console.log("Seeding race profile...");
  await prisma.raceProfile.create({
    data: {
      raceName: "IRONMAN 70.3 Florida",
      raceDate: new Date(Date.UTC(2026, 11, 13)),
      location: "Haines City, FL",
      bibNumber: null,
      swimDistance: "1.2 mi (2.4 km)",
      bikeDistance: "56 mi (90 km)",
      runDistance: "13.1 mi (21.1 km)",
      courseNotes: "Add course-specific notes here as you learn them: swim entry/exit, bike road surface & elevation, run terrain & aid station spacing, etc.",
      splitGoals: j({ swim: "38:00", t1: "3:00", bike: "2:37:00", t2: "2:00", run: "1:32:00", total: "4:52:00" }),
      nutritionPlan: "Key lesson from IRONMAN Omaha 70.3: the late-race hamstring cramp was a sodium deficiency, not a carb issue. Target 500-700mg sodium/hour on the bike (not more carbs) via electrolyte tabs/drink mix, with a redundant sodium source in case one delivery method fails.",
    },
  });

  console.log("Seeding race morning timeline...");
  const timeline = [
    ["4:00 AM", "Wake up", "Sodium + carb breakfast (banana, bagel, electrolyte drink)."],
    ["4:30 AM", "Final gear check", "Load bags, pin race number, confirm sodium/nutrition on bike."],
    ["5:00 AM", "Depart for race venue", "Transition typically opens around this time — confirm with athlete guide."],
    ["5:15 AM", "Body marking + chip check", "Get numbered, confirm timing chip is on."],
    ["5:30 AM", "Set up transition", "Bike + run gear laid out, nutrition/sodium tabs mounted on bike."],
    ["6:00 AM", "Top off fluids", "Sip electrolyte mix, wetsuit on (if wetsuit legal)."],
    ["6:15 AM", "Transition closes", "Walk to swim start."],
    ["6:30 AM", "Swim warm-up", "Warm up if course allows, final sighting check."],
    ["7:00 AM", "RACE START", "Swim wave start — times are placeholders, confirm exact schedule from the official athlete guide."],
  ];
  for (let i = 0; i < timeline.length; i++) {
    const [time, label, detail] = timeline[i];
    await prisma.raceMorningEvent.create({ data: { time, label, detail, order: i } });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
