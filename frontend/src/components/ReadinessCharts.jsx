import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fmtUTC } from "../lib/date";

function TrendChart({ title, data, dataKey, color, unit = "", domain }) {
  const points = data.filter((d) => d[dataKey] != null);
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4 h-72">
      <h3 className="font-semibold text-white text-sm mb-2">{title}</h3>
      {points.length >= 2 ? (
        <ResponsiveContainer width="100%" height="88%">
          <LineChart data={points} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2c2e3a" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" fontSize={11} domain={domain} unit={unit} />
            <Tooltip contentStyle={{ background: "#1a1c26", border: "1px solid #2c2e3a", fontSize: 12 }} formatter={(v) => [`${v}${unit}`, title]} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-gray-600">Not enough synced data yet</div>
      )}
    </div>
  );
}

export default function ReadinessCharts({ metrics, loading }) {
  if (loading) return <div className="text-sm text-gray-500">Loading trends...</div>;
  if (!metrics.length) {
    return (
      <div className="bg-surface-3 border border-border rounded-xl p-4 text-sm text-gray-500">
        No Whoop data yet — connect it on the Fitness page to see trends here.
      </div>
    );
  }

  const trendData = metrics.map((m) => ({
    date: fmtUTC(m.date, { month: "short", day: "numeric" }),
    recovery: m.whoopRecoveryScore,
    strain: m.whoopStrain != null ? Math.round(m.whoopStrain * 10) / 10 : null,
    hrv: m.whoopHrvMilli != null ? Math.round(m.whoopHrvMilli) : null,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <TrendChart title="Recovery" data={trendData} dataKey="recovery" color="#22c55e" unit="%" domain={[0, 100]} />
      <TrendChart title="Strain" data={trendData} dataKey="strain" color="#3b82f6" domain={[0, 21]} />
      <TrendChart title="HRV" data={trendData} dataKey="hrv" color="#e5e7eb" unit="ms" domain={["auto", "auto"]} />
    </div>
  );
}
