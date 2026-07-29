import { LineChart, Line, ResponsiveContainer } from "recharts";
import { readinessBanner } from "../lib/wearables";
import { fmtUTC, localTodayKey } from "../lib/date";

function MiniTrend({ label, data, dataKey, color, unit = "" }) {
  const points = data.filter((d) => d[dataKey] != null);
  const latest = points[points.length - 1];
  return (
    <div className="bg-surface-3 rounded-lg p-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
        <span className="text-sm font-bold text-white">{latest ? `${Math.round(latest[dataKey] * 10) / 10}${unit}` : "—"}</span>
      </div>
      {points.length >= 2 ? (
        <div className="h-10 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-10 mt-1 flex items-center text-[10px] text-gray-600">Not enough data yet</div>
      )}
    </div>
  );
}

export default function ReadinessBoard({ metrics, loading }) {
  if (loading) return <div className="text-sm text-gray-500">Loading readiness...</div>;

  const todayKey = localTodayKey();
  const todayMetric = metrics.find((m) => m.date.slice(0, 10) === todayKey);

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const yesterdayMetric = metrics.find((m) => m.date.slice(0, 10) === yesterday);

  if (!metrics.length) {
    return (
      <div className="bg-surface-3 border border-border rounded-xl p-3 text-sm text-gray-500">
        No Whoop data yet — connect it on the Fitness page to see readiness here.
      </div>
    );
  }

  const banner = readinessBanner(todayMetric?.whoopRecoveryScore ?? null);
  const trendData = metrics.map((m) => ({
    date: fmtUTC(m.date, { month: "short", day: "numeric" }),
    recovery: m.whoopRecoveryScore,
    strain: m.whoopStrain,
    hrv: m.whoopHrvMilli,
  }));

  return (
    <div className="space-y-3">
      <div className={`rounded-xl border ${banner.border} ${banner.bg} px-4 py-3`}>
        <div className={`text-sm font-bold ${banner.text}`}>{banner.message}</div>
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-300">
          <div>
            <span className="text-gray-500">Recovery: </span>
            <span className="font-semibold text-white">{todayMetric?.whoopRecoveryScore != null ? `${Math.round(todayMetric.whoopRecoveryScore)}%` : "not synced"}</span>
          </div>
          <div>
            <span className="text-gray-500">Sleep: </span>
            <span className="font-semibold text-white">{todayMetric?.whoopSleepScore != null ? `${Math.round(todayMetric.whoopSleepScore)}%` : "not synced"}</span>
          </div>
          <div>
            <span className="text-gray-500">Yesterday's Strain: </span>
            <span className="font-semibold text-white">{yesterdayMetric?.whoopStrain != null ? Math.round(yesterdayMetric.whoopStrain * 10) / 10 : "not synced"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniTrend label="Recovery" data={trendData} dataKey="recovery" color="#22c55e" unit="%" />
        <MiniTrend label="Strain" data={trendData} dataKey="strain" color="#3b82f6" />
        <MiniTrend label="HRV" data={trendData} dataKey="hrv" color="#f8fafc" unit="ms" />
      </div>
    </div>
  );
}
