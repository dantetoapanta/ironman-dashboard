import { generateRecommendations } from "../lib/recommendations";

export default function RecommendationsList({ sessions, weather }) {
  const recs = generateRecommendations(sessions.filter((s) => s.discipline !== "RACE"), weather);
  if (recs.length === 0) return null;

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-2">Today's Recommendations</h3>
      <ul className="space-y-1.5">
        {recs.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
            <span>{r.icon}</span>
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
