const express = require("express");

const router = express.Router();

const LOCATIONS = {
  tampa: { name: "Tampa, FL", lat: 27.9506, lon: -82.4572 },
  "haines-city": { name: "Haines City, FL (Race Site)", lat: 28.1114, lon: -81.6321 },
};

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York&forecast_days=7`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Open-Meteo request failed: ${resp.status}`);
  return resp.json();
}

router.get("/:location", async (req, res) => {
  const loc = LOCATIONS[req.params.location];
  if (!loc) return res.status(404).json({ error: `Unknown location. Use one of: ${Object.keys(LOCATIONS).join(", ")}` });
  try {
    const data = await fetchWeather(loc.lat, loc.lon);
    res.json({ location: loc.name, ...data });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch weather", detail: err.message });
  }
});

module.exports = router;
