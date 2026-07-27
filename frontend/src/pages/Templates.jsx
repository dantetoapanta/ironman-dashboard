import { useEffect, useState } from "react";
import { getPhases, getPhaseTemplate } from "../api/client";
import SessionCard from "../components/SessionCard";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Templates() {
  const [phases, setPhases] = useState([]);
  const [activeOrder, setActiveOrder] = useState(1);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPhases().then(setPhases);
  }, []);

  useEffect(() => {
    setLoading(true);
    getPhaseTemplate(activeOrder)
      .then(setTemplate)
      .finally(() => setLoading(false));
  }, [activeOrder]);

  const byDay = template?.templateWeek
    ? Object.entries(
        template.templateWeek.sessions.reduce((acc, s) => {
          const key = s.dayOfWeek;
          (acc[key] ||= []).push(s);
          return acc;
        }, {})
      ).sort(([a], [b]) => {
        // Mon(1)..Sat(6), Sun(0) last
        const na = Number(a) === 0 ? 7 : Number(a);
        const nb = Number(b) === 0 ? 7 : Number(b);
        return na - nb;
      })
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Phase Template Library</h1>
        <p className="text-sm text-gray-400 mt-1">Reference view of the standard weekly structure for each phase of the block.</p>
      </div>

      <div className="flex gap-1 bg-surface-2 border border-border rounded-lg p-1 w-fit overflow-x-auto">
        {phases.map((p) => (
          <button
            key={p.order}
            onClick={() => setActiveOrder(p.order)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${activeOrder === p.order ? "bg-surface-3 text-white" : "text-gray-500"}`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {template && (
        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-white">{template.phase.name}</h2>
            <span className="text-xs text-gray-500">Weeks {template.phase.startWeek}-{template.phase.endWeek} · shown: Week {template.templateWeek.weekNumber}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{template.phase.description}</p>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-sm py-12 text-center">Loading template...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {byDay.map(([dayOfWeek, sessions]) => (
            <div key={dayOfWeek}>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">{DAY_NAMES[Number(dayOfWeek)]}</div>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <SessionCard key={s.id} session={s} readOnly />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
