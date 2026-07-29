const express = require("express");
const { todayUTCMidnight } = require("../lib/dates");

const router = express.Router();

const LOCATIONS = {
  tampa: { name: "Tampa, FL", lat: 27.9506, lon: -82.4572, tz: "America/New_York" },
  "kansas-city": { name: "Kansas City, MO", lat: 39.0997, lon: -94.5786, tz: "America/Chicago" },
  "haines-city": { name: "Haines City, FL (Race Site)", lat: 28.1114, lon: -81.6321, tz: "America/New_York" },
};

// Training base switches from Kansas City to Tampa on Aug 26, 2026 (school
// year start at UT) — a plain date comparison, no manual toggle needed.
const TAMPA_SWITCH_DATE = Date.UTC(2026, 7, 26); // month is 0-indexed: 7 = August

function resolveHomeLocation() {
  const today = todayUTCMidnight();
  if (today.getTime() < TAMPA_SWITCH_DATE) {
    return { key: "kansas-city", reason: "Training out of Kansas City through Aug 25, 2026" };
  }
  return { key: "tampa", reason: "Training out of Tampa, FL (school year)" };
}

async function fetchWeather(lat, lon, tz) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_mean&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=${encodeURIComponent(tz)}&forecast_days=7`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Open-Meteo request failed: ${resp.status}`);
  return resp.json();
}

router.get("/home", async (req, res) => {
  const { key, reason } = resolveHomeLocation();
  const loc = LOCATIONS[key];
  try {
    const data = await fetchWeather(loc.lat, loc.lon, loc.tz);
    res.json({ location: loc.name, locationKey: key, reason, ...data });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch weather", detail: err.message });
  }
});

router.get("/:location", async (req, res) => {
  const loc = LOCATIONS[req.params.location];
  if (!loc) return res.status(404).json({ error: `Unknown location. Use one of: ${Object.keys(LOCATIONS).join(", ")}` });
  try {
    const data = await fetchWeather(loc.lat, loc.lon, loc.tz);
    res.json({ location: loc.name, ...data });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch weather", detail: err.message });
  }
});

module.exports = router;
