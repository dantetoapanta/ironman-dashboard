import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  getWhoopStatus,
  syncWhoop,
  disconnectWhoop,
  getGarminStatus,
  syncGarmin,
  getDailyMetrics,
} from "../api/client";
import { fmtUTC } from "../lib/date";

function WhoopCard({ status, onChange }) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const result = await syncWhoop();
      setMessage(`Synced ${result.synced} day(s) of data.`);
      onChange();
    } catch (err) {
      setMessage(err.response?.data?.error || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    await disconnectWhoop();
    onChange();
  }

  if (!status.configured) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <h3 className="font-semibold text-white text-sm mb-1">Whoop</h3>
        <p className="text-xs text-gray-500">
          Not configured yet. Register an app at{" "}
          <a href="https://developer.whoop.com" target="_blank" rel="noreferrer" className="text-usa-blue underline">
            developer.whoop.com
          </a>{" "}
          and set WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET / WHOOP_REDIRECT_URI on the server.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm">Whoop</h3>
        {status.connected ? (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-usa-blue text-white rounded-full px-2 py-0.5">Connected</span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-3 text-gray-400 rounded-full px-2 py-0.5">Not Connected</span>
        )}
      </div>
      {status.connected ? (
        <>
          <p className="text-xs text-gray-500 mt-1">
            {status.lastSyncedAt ? `Last synced ${fmtUTC(status.lastSyncedAt, { month: "short", day: "numeric" })}` : "Never synced"}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-usa-blue text-white font-semibold text-xs rounded-lg px-3 py-1.5 disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
            <button onClick={handleDisconnect} className="text-xs text-gray-500 hover:text-red-400 px-2">
              Disconnect
            </button>
          </div>
          {message && <p className="text-xs text-gray-400 mt-2">{message}</p>}
        </>
      ) : (
        <a
          href="/api/integrations/whoop/connect"
          className="mt-3 inline-block bg-usa-blue text-white font-semibold text-xs rounded-lg px-3 py-1.5"
        >
          Connect Whoop
        </a>
      )}
    </div>
  );
}

function GarminCard({ status, onChange }) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const result = await syncGarmin();
      setMessage(`Synced ${result.synced} day(s) and ${result.activitiesSynced} activities.`);
      onChange();
    } catch (err) {
      setMessage(err.response?.data?.error || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  if (!status.configured) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <h3 className="font-semibold text-white text-sm mb-1">Garmin</h3>
        <p className="text-xs text-gray-500">
          Not configured yet. Create a personal API key at{" "}
          <a href="https://connect.garmin.com/app/settings/personalApiToken" target="_blank" rel="noreferrer" className="text-usa-blue underline">
            Garmin Connect
          </a>{" "}
          and set GARMIN_PERSONAL_API_KEY on the server.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm">Garmin</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-usa-blue text-white rounded-full px-2 py-0.5">Connected</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {status.lastSyncedAt
          ? `Last synced ${new Date(status.lastSyncedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
          : "Never synced"}
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-usa-blue text-white font-semibold text-xs rounded-lg px-3 py-1.5 disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync Now"}
        </button>
      </div>
      {message && <p className="text-xs text-gray-400 mt-2">{message}</p>}
    </div>
  );
}

function RecoveryTrendChart({ metrics }) {
  const recent = metrics.filter((m) => m.whoopRecoveryScore != null).slice(-7);
  if (recent.length < 2) return null;

  const chartData = recent.map((m) => ({
    date: fmtUTC(m.date, { month: "short", day: "numeric" }),
    recovery: m.whoopRecoveryScore,
  }));

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4 h-56">
      <h3 className="font-semibold text-white text-sm mb-2">7-Day Recovery Trend</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c2e3a" />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
          <YAxis stroke="#6b7280" fontSize={11} domain={[0, 100]} />
          <Tooltip contentStyle={{ background: "#1a1c26", border: "1px solid #2c2e3a", fontSize: 12 }} />
          <Line type="monotone" dataKey="recovery" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricsTable({ metrics }) {
  if (metrics.length === 0) {
    return <div className="text-sm text-gray-500">No wearable data yet — connect Whoop or Garmin above.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[820px]">
        <thead>
          <tr className="text-left text-gray-500 border-b border-border">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3 text-usa-blue">Recovery</th>
            <th className="py-2 pr-3 text-usa-blue">HRV</th>
            <th className="py-2 pr-3 text-usa-blue">Sleep %</th>
            <th className="py-2 pr-3 text-usa-blue">Strain</th>
            <th className="py-2 pr-3 text-usa-red">Steps</th>
            <th className="py-2 pr-3 text-usa-red">Resting HR</th>
            <th className="py-2 pr-3 text-usa-red">Body Batt.</th>
            <th className="py-2 pr-3 text-usa-red">Stress</th>
            <th className="py-2 pr-3 text-usa-red">Train. Load</th>
            <th className="py-2 pr-3 text-usa-red">Sleep Score</th>
          </tr>
        </thead>
        <tbody>
          {[...metrics].slice(-30).reverse().map((m) => (
            <tr key={m.id} className="border-b border-border/50">
              <td className="py-1.5 pr-3 text-white font-medium whitespace-nowrap">{fmtUTC(m.date, { month: "short", day: "numeric" })}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.whoopRecoveryScore ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.whoopHrvMilli ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.whoopSleepScore ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.whoopStrain ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.garminSteps ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.garminRestingHr ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.garminBodyBattery ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.garminStress ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.garminTrainingLoad ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.garminSleepScore ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WearablesPanel() {
  const [status, setStatus] = useState({ configured: false, connected: false });
  const [garminStatus, setGarminStatus] = useState({ configured: false });
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    return Promise.all([getWhoopStatus(), getGarminStatus(), getDailyMetrics()]).then(([s, g, m]) => {
      setStatus(s);
      setGarminStatus(g);
      setMetrics(m);
    });
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));

    const params = new URLSearchParams(window.location.search);
    if (params.get("whoop") === "connected") {
      window.history.replaceState({}, "", "/fitness");
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Wearables</h2>
        <p className="text-sm text-gray-400 mt-1">Recovery, sleep, and strain from Whoop; steps, body battery, stress, and training load from Garmin. Table shows the last 30 days.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <WhoopCard status={status} onChange={refresh} />
        <GarminCard status={garminStatus} onChange={refresh} />
      </div>

      {!loading && <RecoveryTrendChart metrics={metrics} />}
      {!loading && <MetricsTable metrics={metrics} />}
    </div>
  );
}
