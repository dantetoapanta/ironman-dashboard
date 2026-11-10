// VO2 max percentile reference.
//
// Source: Kaminsky LA et al., "Updated Reference Standards for Cardiorespiratory Fitness
// Measured with Cardiopulmonary Exercise Testing" (FRIEND Registry), Mayo Clin Proc 2022.
// Treadmill VO2 max, ml/kg/min, healthy US adults. The values below are for men 20-29 and
// were read from a secondary summary of that paper (the paper's own table was not
// reachable), so re-check them against the paper if exact numbers matter.
//
// Limits to keep visible in the UI:
//  - US lab-tested adults, not a world population.
//  - The youngest published band is 20-29; the athlete is 18.
//  - Garmin's VO2 max is a watch estimate, not a lab test.
//  - The paper publishes the 10th-90th percentiles, so we never extrapolate past them.

export const ATHLETE = { sex: "male", age: 18 };

export const NORM_LABEL = "US men 20–29";

const MEN_20_29 = [
  [10, 28.6],
  [20, 35.2],
  [30, 40.0],
  [40, 43.6],
  [50, 46.5],
  [60, 49.0],
  [70, 51.9],
  [80, 54.5],
  [90, 58.6],
];

export function ordinal(n) {
  const r = n % 100;
  if (r >= 11 && r <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"}`;
}

// -> { p, bound: "below" | "above" | null } or null. p is a whole-number percentile;
// below the 10th / above the 90th we report the bound instead of guessing.
export function vo2Percentile(value) {
  const t = MEN_20_29;
  if (value == null || Number.isNaN(value)) return null;
  if (value < t[0][1]) return { p: t[0][0], bound: "below" };
  if (value > t[t.length - 1][1]) return { p: t[t.length - 1][0], bound: "above" };
  for (let i = 1; i < t.length; i++) {
    const [p0, v0] = t[i - 1];
    const [p1, v1] = t[i];
    if (value <= v1) return { p: Math.round(p0 + ((value - v0) / (v1 - v0)) * (p1 - p0)), bound: null };
  }
  return null;
}
