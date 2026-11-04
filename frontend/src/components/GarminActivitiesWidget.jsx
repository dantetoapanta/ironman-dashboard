import { useEffect, useState } from "react";
import { getGarminActivities } from "../api/client";
import { fmtUTC } from "../lib/date";

const TYPE_ICON = {
  running: "🏃",
  track_running: "🏃",
  treadmill_running: "🏃",
  trail_running: "🏃",
  cycling: "🚴",
  road_biking: "🚴",
  indoor_cycling: "🚴",
  virtual_ride: "🚴",
  mountain_biking: "🚵",
  lap_swimming: "🏊",
  open_water_swimming: "🏊",
  strength_training: "🏋️",
  walking: "🚶",
  hiking: "🥾",
  yoga: "🧘",
};

const METERS_PER_MILE = 1609.344;

function typeLabel(typeKey) {
  if (!typeKey) return "Activity";
  return typeKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDuration(sec) {
  const total = Math.round(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function fmtPace(durationSec, distanceMeter) {
  const secPerMile = durationSec / (distanceMeter / METERS_PER_MILE);
  const m = Math.floor(secPerMile / 60);
  const s = Math.round(secPerMile % 60);
  return `${m}:${String(s).padStart(2, "0")}/mi`;
}

// startLocal is "YYYY-MM-DD HH:MM:SS" as recorded by the watch — use its date
// part directly so late-evening activities don't roll over to the next day.
function fmtLocalDate(startLocal) {
  if (!startLocal) return "";
  return fmtUTC(`${startLocal.slice(0, 10)}T00:00:00Z`, { month: "short", day: "numeric" });
}

export default function GarminActivitiesWidget() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGarminActivities(10)
      .then(setActivities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <div className="text-sm text-gray-500">Loading Garmin activities...</div>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <h3 className="font-semibold text-white text-sm mb-3">Garmin Activities</h3>
      {activities.length === 0 ? (
        <div className="text-sm text-gray-500">No Garmin activities synced yet. Hit Sync Now in the Garmin card on the Fitness page.</div>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => {
            const hasDistance = a.distanceMeter > 0;
            const isRun = a.typeKey?.includes("running");
            const parts = [
              fmtLocalDate(a.startLocal),
              a.durationSec ? fmtDuration(a.durationSec) : null,
              hasDistance ? `${(a.distanceMeter / METERS_PER_MILE).toFixed(1)} mi` : null,
              hasDistance && isRun && a.durationSec ? fmtPace(a.durationSec, a.distanceMeter) : null,
              a.avgHr != null ? `${Math.round(a.avgHr)} avg HR` : null,
            ].filter(Boolean);
            return (
              <div key={a.id} className="flex items-center gap-3 bg-surface-3 rounded-lg px-3 py-2">
                <span className="text-xl shrink-0">{TYPE_ICON[a.typeKey] || "💪"}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{typeLabel(a.typeKey)}</div>
                  <div className="text-[11px] text-gray-500">{parts.join(" · ")}</div>
                </div>
                {a.trainingLoad != null && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-usa-red">{Math.round(a.trainingLoad)}</div>
                    <div className="text-[10px] text-gray-500">load</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
