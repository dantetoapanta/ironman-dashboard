import { useState } from "react";
import { disciplineMeta, parseDetails } from "../lib/discipline";
import { setSessionCompletion } from "../api/client";

function StructureTable({ structure }) {
  if (!structure?.length) return null;
  return (
    <table className="w-full text-xs mt-2 border-collapse">
      <tbody>
        {structure.map((row, i) => (
          <tr key={i} className="border-t border-border/60">
            <td className="py-1 pr-2 text-gray-400 whitespace-nowrap">{row.label}</td>
            <td className="py-1 pr-2 text-gray-300 whitespace-nowrap">{row.duration}</td>
            <td className="py-1 text-gray-300">{row.intensity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExerciseTable({ exercises }) {
  if (!exercises?.length) return null;
  return (
    <table className="w-full text-xs mt-2 border-collapse">
      <tbody>
        {exercises.map((ex, i) => (
          <tr key={i} className="border-t border-border/60">
            <td className="py-1 pr-2 text-gray-300">{ex.name}</td>
            <td className="py-1 pr-2 text-gray-400 whitespace-nowrap">{ex.scheme}</td>
            <td className="py-1 text-gray-400 whitespace-nowrap">{ex.load}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SwimSetDetail({ details }) {
  return (
    <div className="text-xs mt-2 space-y-1 text-gray-300">
      {details.warmupYd && <div><span className="text-gray-500">Warm-up:</span> {details.warmupYd}y</div>}
      {details.mainSet && <div><span className="text-gray-500">Main set:</span> {details.mainSet}</div>}
      {details.cooldownYd && <div><span className="text-gray-500">Cool-down:</span> {details.cooldownYd}y</div>}
      {details.totalYards && <div className="text-gray-500">Total: ~{details.totalYards}y</div>}
    </div>
  );
}

function DetailBody({ discipline, details }) {
  if (!details) return null;
  if (discipline === "BIKE" && details.structure) return <StructureTable structure={details.structure} />;
  if (discipline === "LIFT" && details.exercises) return <ExerciseTable exercises={details.exercises} />;
  if (discipline === "SWIM" && (details.mainSet || details.warmupYd)) return <SwimSetDetail details={details} />;
  if (discipline === "RUN" && details.targetPace) {
    return (
      <div className="text-xs mt-2 text-gray-300">
        {details.warmupMi && <div><span className="text-gray-500">Warm-up:</span> {details.warmupMi}mi</div>}
        {details.mainSet && <div><span className="text-gray-500">Main set:</span> {details.mainSet}</div>}
        {details.strides && <div><span className="text-gray-500">Strides:</span> {details.strides}</div>}
        <div className="text-gray-500">Target pace: {details.targetPace}</div>
      </div>
    );
  }
  return null;
}

export default function SessionCard({ session, onChange, compact = false, readOnly = false }) {
  const meta = disciplineMeta(session.discipline);
  const details = parseDetails(session.details);
  const [busy, setBusy] = useState(false);
  const completed = !!session.completion?.completed;
  const isRace = session.discipline === "RACE" || readOnly;

  async function toggle() {
    if (isRace || busy) return;
    setBusy(true);
    try {
      const updated = await setSessionCompletion(session.id, !completed);
      onChange?.(session.id, updated);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-xl border ${meta.border} ${meta.bg} p-3 ${completed ? "opacity-60" : ""} transition-opacity`}
    >
      <div className="flex items-start gap-3">
        {!isRace && (
          <button
            onClick={toggle}
            disabled={busy}
            aria-label={completed ? "Mark incomplete" : "Mark complete"}
            className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center text-[10px] ${
              completed ? "bg-green-500 border-green-500 text-black" : "border-gray-500 text-transparent"
            }`}
          >
            ✓
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
              {meta.icon} {meta.label}
            </span>
            {(session.durationMin || session.distanceMi) && (
              <span className="text-[10px] text-gray-500">
                {session.distanceMi ? `${session.distanceMi}mi` : ""}
                {session.distanceMi && session.durationMin ? " · " : ""}
                {session.durationMin ? `${session.durationMin}min` : ""}
              </span>
            )}
          </div>
          <div className={`font-semibold text-sm text-white mt-0.5 ${completed ? "line-through" : ""}`}>
            {session.title}
          </div>
          {!compact && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{session.description}</p>}
          {!compact && <DetailBody discipline={session.discipline} details={details} />}
        </div>
      </div>
    </div>
  );
}
