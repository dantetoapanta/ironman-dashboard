// Estimates session duration in minutes when the plan only stores distance
// (long runs/rides), using the pace assumptions baked into the seeded plan.
function estimateDurationMin(session) {
  if (session.durationMin) return session.durationMin;
  if (!session.distanceMi) return null;
  const paceMinPerMi = { RUN: 7.9, BIKE: 3.2, SWIM: null, LIFT: null }[session.discipline];
  if (!paceMinPerMi) return null;
  return Math.round(session.distanceMi * paceMinPerMi);
}

// Sodium/fluid targets anchored to the 500-700mg/hr rate that fixed the
// Omaha cramp (a sodium deficiency, not a carb one) — scaled down for
// shorter/cooler training sessions and up for hot/long ones. Tune the
// constants below if these don't match how you actually respond.
function hydrationForSession(session, weather) {
  const minutes = estimateDurationMin(session);
  if (!minutes || minutes < 20) return null;

  const tempF = weather?.daily?.temperature_2m_max?.[0] ?? 85;
  const humidity = weather?.daily?.relative_humidity_2m_mean?.[0] ?? 60;

  let sodiumRatePerHr;
  if (tempF < 65) sodiumRatePerHr = 300;
  else if (tempF < 75) sodiumRatePerHr = 400;
  else if (tempF < 85) sodiumRatePerHr = 550;
  else if (tempF < 95) sodiumRatePerHr = 700;
  else sodiumRatePerHr = 850;

  if (humidity >= 70) sodiumRatePerHr += 50;
  if (session.discipline === "SWIM") sodiumRatePerHr *= 0.6; // cooler, less sweat loss

  let fluidOzPerHr = 16;
  if (tempF >= 75) fluidOzPerHr = 20;
  if (tempF >= 85) fluidOzPerHr = 24;
  if (tempF >= 95) fluidOzPerHr = 28;

  const hours = minutes / 60;
  const sodiumMg = Math.round((sodiumRatePerHr * hours) / 25) * 25;
  const fluidOz = Math.round(fluidOzPerHr * hours);

  return { sodiumMg, fluidOz, rateMgPerHr: Math.round(sodiumRatePerHr), hours: Math.round(hours * 10) / 10 };
}

const MOBILITY_TIPS = {
  RUN: "Hip flexor + ankle mobility before you head out (leg swings, ankle circles).",
  BIKE: "Hip flexor & thoracic spine mobility pre-ride; foam roll quads/IT band after.",
  SWIM: "Shoulder & thoracic rotation drills before getting in; band pull-aparts after.",
  LIFT: "Dynamic warm-up (leg swings, arm circles, bodyweight squats) before; static stretch cooldown after.",
};

const DISCIPLINE_LABEL = { RUN: "Run", BIKE: "Bike", SWIM: "Swim", LIFT: "Lift" };

export function generateRecommendations(sessions, weather) {
  const recs = [];
  const relevant = sessions.filter((s) => s.discipline !== "RACE");

  for (const session of relevant) {
    const hydration = hydrationForSession(session, weather);
    if (hydration) {
      recs.push({
        icon: "💧",
        text: `${DISCIPLINE_LABEL[session.discipline] || session.discipline}: ~${hydration.fluidOz}oz fluid + ${hydration.sodiumMg}mg sodium over ~${hydration.hours}hr (${hydration.rateMgPerHr}mg/hr pace).`,
      });
    }
  }

  const disciplinesToday = [...new Set(relevant.map((s) => s.discipline))];
  for (const d of disciplinesToday) {
    if (MOBILITY_TIPS[d]) recs.push({ icon: "🤸", text: MOBILITY_TIPS[d] });
  }

  return recs.slice(0, 5);
}
