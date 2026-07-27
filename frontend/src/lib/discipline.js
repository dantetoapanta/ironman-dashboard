export const DISCIPLINE_META = {
  RUN: { label: "Run", color: "text-run", bg: "bg-run/15", border: "border-run/40", icon: "🏃" },
  BIKE: { label: "Bike", color: "text-bike", bg: "bg-bike/15", border: "border-bike/40", icon: "🚴" },
  SWIM: { label: "Swim", color: "text-swim", bg: "bg-swim/15", border: "border-swim/40", icon: "🏊" },
  LIFT: { label: "Strength", color: "text-lift", bg: "bg-lift/15", border: "border-lift/40", icon: "🏋️" },
  RACE: { label: "Race Day", color: "text-race", bg: "bg-race/15", border: "border-race/40", icon: "🏁" },
};

export function disciplineMeta(discipline) {
  return DISCIPLINE_META[discipline] || DISCIPLINE_META.RUN;
}

export function parseDetails(details) {
  if (!details) return null;
  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}
