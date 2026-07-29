const AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const API_BASE = "https://api.prod.whoop.com/developer";

const SCOPES = ["read:recovery", "read:sleep", "read:cycles", "read:profile", "offline"].join(" ");

function config() {
  return {
    clientId: process.env.WHOOP_CLIENT_ID,
    clientSecret: process.env.WHOOP_CLIENT_SECRET,
    redirectUri: process.env.WHOOP_REDIRECT_URI,
  };
}

function isConfigured() {
  const c = config();
  return !!(c.clientId && c.clientSecret && c.redirectUri);
}

function buildAuthorizeUrl(state) {
  const c = config();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: c.clientId,
    redirect_uri: c.redirectUri,
    scope: SCOPES,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  const c = config();
  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: c.redirectUri,
      client_id: c.clientId,
      client_secret: c.clientSecret,
    }),
  });
  if (!resp.ok) throw new Error(`Whoop token exchange failed: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

async function refreshTokens(refreshToken) {
  const c = config();
  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: c.clientId,
      client_secret: c.clientSecret,
      scope: SCOPES,
    }),
  });
  if (!resp.ok) throw new Error(`Whoop token refresh failed: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

async function apiGet(accessToken, path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!resp.ok) throw new Error(`Whoop API ${path} failed: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

function getRecoveries(accessToken, params) {
  return apiGet(accessToken, "/v2/recovery", params);
}
function getSleeps(accessToken, params) {
  return apiGet(accessToken, "/v2/activity/sleep", params);
}
function getCycles(accessToken, params) {
  return apiGet(accessToken, "/v2/cycle", params);
}

module.exports = {
  isConfigured,
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  refreshTokens,
  getRecoveries,
  getSleeps,
  getCycles,
};
