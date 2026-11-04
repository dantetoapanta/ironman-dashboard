// Garmin Personal API: a personal API key (generated on Garmin Connect web) is
// exchanged for a 24-hour bearer token. There is no refresh token — just
// exchange the key again. Read-only, for your own data.
const BASE_URL = process.env.GARMIN_PERSONAL_API_BASE_URL || "https://personal.connectapi.garmin.com";
const TOKEN_PATH = "/personalapitoken-service/personal-api/personal-api-key/token";
const RENEW_WINDOW_MS = 60 * 60 * 1000; // renew when under an hour remains
// Sleep and Body Battery endpoints return 400 on ranges somewhere past ~30 days.
const MAX_RANGE_DAYS = 28;

let cached = null; // { token, expiresAt }
let inflight = null;

class GarminKeyError extends Error {}

function isConfigured() {
  return !!process.env.GARMIN_PERSONAL_API_KEY;
}

function jwtExpiryMs(token) {
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  return payload.exp * 1000;
}

async function exchangeKey() {
  const resp = await fetch(`${BASE_URL}${TOKEN_PATH}`, {
    method: "POST",
    headers: { Accept: "*/*", Authorization: `ApiKey ${process.env.GARMIN_PERSONAL_API_KEY}` },
  });
  if (resp.status === 401 || resp.status === 403) {
    throw new GarminKeyError("Garmin rejected the API key — it may have expired or been deleted. Generate a new one on Garmin Connect and update GARMIN_PERSONAL_API_KEY.");
  }
  if (!resp.ok) throw new Error(`Garmin token exchange failed: ${resp.status}`);
  const token = (await resp.text()).trim();
  return { token, expiresAt: jwtExpiryMs(token) };
}

async function getAccessToken(force = false) {
  if (!force && cached && cached.expiresAt - Date.now() > RENEW_WINDOW_MS) return cached.token;
  if (!inflight) {
    inflight = exchangeKey()
      .then((c) => (cached = c))
      .finally(() => (inflight = null));
  }
  return (await inflight).token;
}

async function apiGet(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getAccessToken(attempt === 1);
    const resp = await fetch(url, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
    if (resp.status === 401 && attempt === 0) continue; // stale token — re-exchange once
    if (!resp.ok) throw new Error(`Garmin API ${path} failed: ${resp.status} ${(await resp.text()).slice(0, 200)}`);
    return resp.json();
  }
}

// Splits an inclusive YYYY-MM-DD range into windows the API will accept.
function chunkRange(startDate, endDate) {
  const chunks = [];
  let cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= end) {
    const chunkEnd = new Date(Math.min(cursor.getTime() + (MAX_RANGE_DAYS - 1) * 86400000, end.getTime()));
    chunks.push([cursor.toISOString().slice(0, 10), chunkEnd.toISOString().slice(0, 10)]);
    cursor = new Date(chunkEnd.getTime() + 86400000);
  }
  return chunks;
}

async function chunked(startDate, endDate, fetchChunk) {
  const results = [];
  for (const [s, e] of chunkRange(startDate, endDate)) results.push(...(await fetchChunk(s, e)));
  return results;
}

const getDailySummaries = (start, end) =>
  chunked(start, end, async (s, e) => (await apiGet("/usersummary-service/v2/dailysummaries", { startDate: s, endDate: e })).data || []);

const getSleepSummaries = (start, end) =>
  chunked(start, end, async (s, e) => (await apiGet("/sleep-service/sleep/dailySleepSummariesByDate", { startDate: s, endDate: e })) || []);

const getHrvSummaries = (start, end) =>
  chunked(start, end, async (s, e) => (await apiGet(`/hrv-service/hrv/daily/${s}/${e}`)).hrvSummaries || []);

async function getActivities(startDate, endDate) {
  const PAGE = 100;
  const all = [];
  for (let page = 0; page < 10; page++) {
    const batch = await apiGet("/activitylist-service/activities/search/activities", {
      start: page * PAGE,
      limit: PAGE,
      startDate,
      endDate,
    });
    all.push(...batch);
    if (batch.length < PAGE) break;
  }
  return all;
}

module.exports = {
  GarminKeyError,
  isConfigured,
  getDailySummaries,
  getSleepSummaries,
  getHrvSummaries,
  getActivities,
};
