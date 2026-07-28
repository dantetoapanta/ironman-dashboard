import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getFitnessTests, createFitnessTest, deleteFitnessTest } from "../api/client";
import { fmtUTC } from "../lib/date";

const TEST_TYPES = [
  { value: "FTP", label: "Bike FTP", unit: "watts" },
  { value: "SWIM_TT", label: "Swim Time Trial (100y/100m)", unit: "sec_per_100y" },
  { value: "RUN_5K", label: "Run 5K Time Trial", unit: "sec" },
  { value: "RUN_TT", label: "Run Time Trial (other distance)", unit: "sec" },
];

function fmtValue(type, value) {
  if (type === "FTP") return `${value}W`;
  if (type === "SWIM_TT") {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return `${m}:${String(s).padStart(2, "0")}/100`;
  }
  const m = Math.floor(value / 60);
  const s = Math.round(value % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function emptyForm() {
  return { type: "FTP", date: new Date().toISOString().slice(0, 10), value: "", notes: "" };
}

export default function FitnessTests() {
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("FTP");

  function refresh() {
    return getFitnessTests().then(setTests);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const meta = TEST_TYPES.find((t) => t.value === form.type);
    await createFitnessTest({ type: form.type, date: form.date, value: Number(form.value), unit: meta.unit, notes: form.notes });
    setForm(emptyForm());
    refresh();
  }

  async function handleDelete(id) {
    await deleteFitnessTest(id);
    refresh();
  }

  const filtered = tests.filter((t) => t.type === activeType).sort((a, b) => new Date(a.date) - new Date(b.date));
  const chartData = filtered.map((t) => ({
    date: fmtUTC(t.date, { month: "short", day: "numeric" }),
    value: t.value,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Fitness Test Tracker</h1>
        <p className="text-sm text-gray-400 mt-1">Log FTP tests, swim time trials, and run time trials to track fitness across the block.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-surface-2 border border-border rounded-xl p-4">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="col-span-2 sm:col-span-1 bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-sm text-white"
        >
          {TEST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-sm text-white"
        />
        <input
          type="number"
          step="0.1"
          placeholder={form.type === "FTP" ? "Watts" : "Seconds"}
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          required
          className="bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-sm text-white"
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="col-span-2 sm:col-span-1 bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-sm text-white"
        />
        <button type="submit" className="bg-bat text-black font-semibold text-sm rounded-lg px-3 py-1.5 hover:brightness-110">
          Log Test
        </button>
      </form>

      <div className="flex gap-1 bg-surface-2 border border-border rounded-lg p-1 w-fit">
        {TEST_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveType(t.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${activeType === t.value ? "bg-surface-3 text-white" : "text-gray-500"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!loading && chartData.length > 1 && (
        <div className="bg-surface-2 border border-border rounded-xl p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2c2e3a" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#1a1c26", border: "1px solid #2c2e3a", fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="#ffc72c" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && <div className="text-sm text-gray-500">No {TEST_TYPES.find((t) => t.value === activeType)?.label} entries yet.</div>}
        {[...filtered].reverse().map((t) => (
          <div key={t.id} className="flex items-center justify-between bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm">
            <div>
              <span className="text-white font-semibold">{fmtValue(t.type, t.value)}</span>
              <span className="text-gray-500 ml-2">{fmtUTC(t.date, { month: "short", day: "numeric", year: "numeric" })}</span>
              {t.notes && <span className="text-gray-500 ml-2">· {t.notes}</span>}
            </div>
            <button onClick={() => handleDelete(t.id)} className="text-gray-500 hover:text-red-400 text-xs">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
