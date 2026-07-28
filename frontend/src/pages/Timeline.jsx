import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPhases } from "../api/client";
import { fmtUTC, localTodayAsUTCDate } from "../lib/date";

const PHASE_COLORS = {
  Reconstruction: "#a78bfa",
  Base: "#38bdf8",
  Build: "#f97316",
  Peak: "#f43f5e",
  Taper: "#22c55e",
};

export default function Timeline() {
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPhases().then(setPhases).finally(() => setLoading(false));
  }, []);

  const { totalWeeks, todayPct, todayWeekNumber, raceDate, startDate } = useMemo(() => {
    if (!phases.length) return { totalWeeks: 21, todayPct: 0, todayWeekNumber: null, raceDate: null, startDate: null };
    const allWeeks = phases.flatMap((p) => p.weeks);
    const total = allWeeks.length;
    const first = allWeeks[0];
    const last = allWeeks[allWeeks.length - 1];
    const start = new Date(first.startDate);
    const end = new Date(last.endDate);
    const today = localTodayAsUTCDate();
    const clampedToday = today < start ? start : today > end ? end : today;
    const pct = ((clampedToday - start) / (end - start)) * 100;
    const currentWeek = allWeeks.find((w) => new Date(w.startDate) <= today && new Date(w.endDate) >= today);
    return { totalWeeks: total, todayPct: pct, todayWeekNumber: currentWeek?.weekNumber, raceDate: end, startDate: start };
  }, [phases]);

  if (loading) return <div className="text-gray-500 text-sm py-12 text-center">Loading timeline...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">21-Week Build Timeline</h1>
          <p className="text-sm text-gray-400 mt-1">
            {fmtUTC(startDate, { month: "short", day: "numeric", year: "numeric" })} →{" "}
            {fmtUTC(raceDate, { month: "short", day: "numeric", year: "numeric" })} · IRONMAN 70.3 Florida
            {todayWeekNumber && ` · Currently Week ${todayWeekNumber}`}
          </p>
        </div>
        <Link
          to="/print/full-plan"
          className="no-print shrink-0 bg-surface-3 border border-border text-gray-200 text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-surface-2"
        >
          🖨️ Export Full Plan
        </Link>
      </div>

      <div className="relative">
        <div className="flex h-16 rounded-lg overflow-hidden border border-border">
          {phases.map((phase) => {
            const weeksInPhase = phase.endWeek - phase.startWeek + 1;
            const widthPct = (weeksInPhase / totalWeeks) * 100;
            return (
              <div
                key={phase.id}
                style={{ width: `${widthPct}%`, backgroundColor: `${PHASE_COLORS[phase.name]}33` }}
                className="relative flex flex-col items-center justify-center border-r border-border last:border-r-0 px-1"
              >
                <div className="text-[11px] font-bold text-white truncate">{phase.name}</div>
                <div className="text-[10px] text-gray-400">Wk {phase.startWeek}-{phase.endWeek}</div>
              </div>
            );
          })}
        </div>
        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-bat shadow-[0_0_8px_rgba(255,199,44,0.8)]"
          style={{ left: `${todayPct}%` }}
          title="Today"
        >
          <div className="absolute -top-6 -translate-x-1/2 text-[10px] font-bold text-black bg-bat px-1.5 py-0.5 rounded whitespace-nowrap">
            TODAY
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {phases.map((phase) => (
          <div key={phase.id} className="rounded-xl border border-border bg-surface-2 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase.name] }} />
              <h2 className="font-semibold text-white text-sm">{phase.name}</h2>
              <span className="text-[11px] text-gray-500 ml-auto">Weeks {phase.startWeek}-{phase.endWeek}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{phase.description}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-2">Weekly volume</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="text-left text-gray-500 border-b border-border">
                <th className="py-2 pr-3">Wk</th>
                <th className="py-2 pr-3">Phase</th>
                <th className="py-2 pr-3">Run (mi)</th>
                <th className="py-2 pr-3">Bike (mi)</th>
                <th className="py-2 pr-3">Swim (yd)</th>
                <th className="py-2">Dates</th>
              </tr>
            </thead>
            <tbody>
              {phases.flatMap((phase) =>
                phase.weeks.map((w) => {
                  const isToday = w.weekNumber === todayWeekNumber;
                  return (
                    <tr key={w.id} className={`border-b border-border/50 ${isToday ? "bg-surface-3" : ""}`}>
                      <td className="py-1.5 pr-3 text-white font-medium">{w.weekNumber}</td>
                      <td className="py-1.5 pr-3 text-gray-400">{phase.name}</td>
                      <td className="py-1.5 pr-3 text-gray-300">{w.runMileage}</td>
                      <td className="py-1.5 pr-3 text-gray-300">{w.bikeMileage}</td>
                      <td className="py-1.5 pr-3 text-gray-300">{w.swimYards}</td>
                      <td className="py-1.5 text-gray-500">
                        {fmtUTC(w.startDate, { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
