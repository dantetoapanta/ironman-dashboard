import { readinessBanner } from "../lib/wearables";
import { localTodayKey } from "../lib/date";

export default function ReadinessBanner({ metrics, loading }) {
  if (loading) return <div className="text-sm text-gray-500">Loading readiness...</div>;

  if (!metrics.length) {
    return (
      <div className="bg-surface-3 border border-border rounded-xl p-3 text-sm text-gray-500">
        No Whoop data yet — connect it on the Fitness page to see readiness here.
      </div>
    );
  }

  const todayKey = localTodayKey();
  const todayMetric = metrics.find((m) => m.date.slice(0, 10) === todayKey);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const yesterdayMetric = metrics.find((m) => m.date.slice(0, 10) === yesterday);
  const banner = readinessBanner(todayMetric?.whoopRecoveryScore ?? null);

  return (
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
  );
}
