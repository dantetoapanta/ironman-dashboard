import { useEffect, useState } from "react";
import {
  getWhoopStatus,
  syncWhoop,
  disconnectWhoop,
  importGarminCsv,
  getDailyMetrics,
} from "../api/client";
import { fmtUTC } from "../lib/date";

const GARMIN_TEMPLATE = "date,steps,resting_hr,body_battery,training_load,sleep_hours,calories\n2026-07-27,11234,48,72,145,7.5,2650\n";

function downloadTemplate() {
  const blob = new Blob([GARMIN_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "garmin-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

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

function GarminCard({ onChange }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const text = await file.text();
      const res = await importGarminCsv(text);
      setResult(res);
      onChange();
    } catch (err) {
      setResult({ error: err.response?.data?.error || "Import failed." });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <h3 className="font-semibold text-white text-sm">Garmin</h3>
      <p className="text-xs text-gray-500 mt-1">
        No accessible personal-use API, so import a CSV export manually — steps, resting HR, body battery, training load, sleep, calories.
      </p>
      <div className="flex gap-2 mt-3 items-center">
        <label className="bg-usa-blue text-white font-semibold text-xs rounded-lg px-3 py-1.5 cursor-pointer">
          {busy ? "Importing..." : "Upload CSV"}
          <input type="file" accept=".csv,text/csv" onChange={handleFile} disabled={busy} className="hidden" />
        </label>
        <button onClick={downloadTemplate} className="text-xs text-gray-500 hover:text-white px-2">
          Download template
        </button>
      </div>
      {result && (
        <p className="text-xs mt-2 text-gray-400">
          {result.error ? result.error : `Imported ${result.imported} day(s).${result.errors?.length ? ` ${result.errors.length} row(s) skipped.` : ""}`}
        </p>
      )}
    </div>
  );
}

function MetricsTable({ metrics }) {
  if (metrics.length === 0) {
    return <div className="text-sm text-gray-500">No wearable data yet — connect Whoop or import a Garmin CSV above.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="text-left text-gray-500 border-b border-border">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3 text-usa-blue">Recovery</th>
            <th className="py-2 pr-3 text-usa-blue">HRV</th>
            <th className="py-2 pr-3 text-usa-blue">Sleep %</th>
            <th className="py-2 pr-3 text-usa-blue">Strain</th>
            <th className="py-2 pr-3 text-usa-red">Steps</th>
            <th className="py-2 pr-3 text-usa-red">Body Batt.</th>
            <th className="py-2 pr-3 text-usa-red">Training Load</th>
          </tr>
        </thead>
        <tbody>
          {[...metrics].reverse().map((m) => (
            <tr key={m.id} className="border-b border-border/50">
              <td className="py-1.5 pr-3 text-white font-medium whitespace-nowrap">{fmtUTC(m.date, { month: "short", day: "numeric" })}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.whoopRecoveryScore ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.whoopHrvMilli ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.whoopSleepScore ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.whoopStrain ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.garminSteps ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.garminBodyBattery ?? "—"}</td>
              <td className="py-1.5 pr-3 text-gray-300">{m.garminTrainingLoad ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WearablesPanel() {
  const [status, setStatus] = useState({ configured: false, connected: false });
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    return Promise.all([getWhoopStatus(), getDailyMetrics()]).then(([s, m]) => {
      setStatus(s);
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
        <p className="text-sm text-gray-400 mt-1">Recovery, sleep, and strain from Whoop; steps and body battery from Garmin.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <WhoopCard status={status} onChange={refresh} />
        <GarminCard onChange={refresh} />
      </div>

      {!loading && <MetricsTable metrics={metrics} />}
    </div>
  );
}
