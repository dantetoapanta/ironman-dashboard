import { useEffect, useState } from "react";
import { getWhoopWorkouts } from "../api/client";
import { fmtUTC } from "../lib/date";

const SPORT_ICON = {
  running: "🏃",
  cycling: "🚴",
  swimming: "🏊",
  weightlifting: "🏋️",
  walking: "🚶",
  hiking: "🥾",
  rowing: "🚣",
  yoga: "🧘",
  jumping_rope: "🪢",
  functional_fitness: "🏋️",
  soccer: "⚽",
  basketball: "🏀",
  golf: "⛳",
};

function sportIcon(sportName) {
  if (!sportName) return "💪";
  return SPORT_ICON[sportName.toLowerCase().replace(/\s+/g, "_")] || "💪";
}

function sportLabel(sportName) {
  if (!sportName) return "Activity";
  return sportName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function WhoopWorkoutsWidget() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWhoopWorkouts(10)
      .then(setWorkouts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <div className="text-sm text-gray-500">Loading Whoop activities...</div>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <h3 className="font-semibold text-white text-sm mb-3">Whoop Activities</h3>
      {workouts.length === 0 ? (
        <div className="text-sm text-gray-500">
          No logged Whoop activities synced yet. If you've connected Whoop before this feature was added, disconnect and reconnect on the Fitness page to grant workout access, then hit Sync Now.
        </div>
      ) : (
        <div className="space-y-2">
          {workouts.map((w) => (
            <div key={w.id} className="flex items-center gap-3 bg-surface-3 rounded-lg px-3 py-2">
              <span className="text-xl shrink-0">{sportIcon(w.sportName)}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white">{sportLabel(w.sportName)}</div>
                <div className="text-[11px] text-gray-500">
                  {fmtUTC(w.start, { month: "short", day: "numeric" })} · {w.durationMin}min
                  {w.avgHr != null ? ` · ${Math.round(w.avgHr)} avg HR` : ""}
                  {w.kilojoule != null ? ` · ${Math.round(w.kilojoule * 0.239)} cal` : ""}
                </div>
              </div>
              {w.strain != null && (
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-usa-blue">{Math.round(w.strain * 10) / 10}</div>
                  <div className="text-[10px] text-gray-500">strain</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
