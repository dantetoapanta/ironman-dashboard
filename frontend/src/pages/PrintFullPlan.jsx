import { useEffect, useState } from "react";
import { getWeeks } from "../api/client";
import SessionCard from "../components/SessionCard";
import PrintButton from "../components/PrintButton";
import { fmtUTC } from "../lib/date";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PrintFullPlan() {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeks().then(setWeeks).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 text-sm py-12 text-center">Loading full plan...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-xl font-bold text-white">Full 21-Week Plan</h1>
          <p className="text-sm text-gray-400 mt-1">Printable view of the entire training block.</p>
        </div>
        <PrintButton label="Print Full Plan" />
      </div>

      {weeks.map((week) => (
        <div key={week.id} className="break-inside-avoid">
          <div className="border-b border-border pb-1 mb-2">
            <h2 className="font-bold text-white">
              Week {week.weekNumber} · {week.phase.name}
            </h2>
            <p className="text-xs text-gray-500">
              {fmtUTC(week.startDate, { month: "short", day: "numeric" })} –{" "}
              {fmtUTC(week.endDate, { month: "short", day: "numeric" })} · Run {week.runMileage}mi · Bike {week.bikeMileage}mi · Swim {week.swimYards}yd
            </p>
            {week.focus && <p className="text-xs text-gray-400 mt-1">{week.focus}</p>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {week.sessions.map((s) => (
              <SessionCard key={s.id} session={s} readOnly compact />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
