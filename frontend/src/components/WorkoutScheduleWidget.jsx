import { useEffect, useState } from "react";
import { getActiveScheduleProfile } from "../api/client";
import { buildDayTimeline, formatMinutes } from "../lib/scheduler";
import { disciplineMeta } from "../lib/discipline";

export default function WorkoutScheduleWidget({ sessions }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveScheduleProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <div className="text-sm text-gray-500">Loading today's schedule...</div>
      </div>
    );
  }

  const relevantSessions = sessions.filter((s) => s.discipline !== "RACE");
  const timeline = buildDayTimeline(relevantSessions, profile);

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">Today's Schedule</h3>
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{profile?.name || "No profile"}</span>
      </div>

      {timeline.length === 0 ? (
        <div className="text-sm text-gray-500">Nothing to schedule today.</div>
      ) : (
        <div className="space-y-1.5">
          {timeline.map((item, i) => {
            if (item.type === "class") {
              return (
                <div key={i} className="flex items-center gap-3 bg-surface-3/60 rounded-lg px-3 py-2 text-gray-400">
                  <span className="text-base shrink-0">🎓</span>
                  <div className="text-xs font-medium whitespace-nowrap w-28 shrink-0">
                    {formatMinutes(item.startMin)} – {formatMinutes(item.endMin)}
                  </div>
                  <div className="text-xs">{item.label}</div>
                </div>
              );
            }
            const meta = disciplineMeta(item.session.discipline);
            return (
              <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${meta.border} ${meta.bg}`}>
                <span className="text-base shrink-0">{meta.icon}</span>
                <div className="text-xs font-medium text-white whitespace-nowrap w-28 shrink-0">
                  {formatMinutes(item.startMin)} – {formatMinutes(item.endMin)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white truncate">{item.session.title}</div>
                  {item.tooLate && <div className="text-[10px] text-yellow-400">Runs later than usual today — plan accordingly.</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-gray-600 mt-3">
        Suggested times, fit around your class blocks — adjust as needed. Update your class schedule anytime in Settings.
      </p>
    </div>
  );
}
