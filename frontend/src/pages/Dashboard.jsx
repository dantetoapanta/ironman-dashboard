import { useEffect, useMemo, useState } from "react";
import { getCurrentWeek, getTodaySessions, getWeather, getDailyMetrics } from "../api/client";
import SessionCard from "../components/SessionCard";
import PrintButton from "../components/PrintButton";
import { localTodayKey, greeting } from "../lib/date";
import { recoveryColor, latestWithField } from "../lib/wearables";

const ATHLETE_NAME = "Dante";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ComplianceRing({ pct }) {
  const size = 56;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#2c2e3a" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#3b82f6"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="white" fontWeight="700">
        {pct}%
      </text>
    </svg>
  );
}

function weatherIcon(code) {
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

function RecoveryBadge() {
  const [metric, setMetric] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    getDailyMetrics(start, end)
      .then((metrics) => setMetric(latestWithField(metrics, "whoopRecoveryScore")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !metric) return null;
  const color = recoveryColor(metric.whoopRecoveryScore);

  return (
    <div className={`flex items-center gap-2 rounded-xl border border-border px-3 py-2 ${color.bg}`}>
      <div className={`text-lg font-bold ${color.text}`}>{Math.round(metric.whoopRecoveryScore)}%</div>
      <div className="text-xs text-gray-400 leading-tight">
        Whoop
        <br />
        Recovery
      </div>
    </div>
  );
}

function WeatherStrip() {
  const [tampa, setTampa] = useState(null);
  useEffect(() => {
    getWeather("tampa").then(setTampa).catch(() => {});
  }, []);
  if (!tampa?.current) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 bg-surface-2 border border-border rounded-lg px-3 py-2">
      <span>{weatherIcon(tampa.current.weather_code)}</span>
      <span className="text-white font-medium">{Math.round(tampa.current.temperature_2m)}°F</span>
      <span>Tampa now</span>
      <span className="text-gray-600">·</span>
      <span>Feels {Math.round(tampa.current.apparent_temperature)}°F</span>
      <span className="text-gray-600">·</span>
      <span>{tampa.current.relative_humidity_2m}% humidity</span>
    </div>
  );
}

export default function Dashboard() {
  const [week, setWeek] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("today");

  useEffect(() => {
    Promise.all([getCurrentWeek(), getTodaySessions()])
      .then(([w, t]) => {
        setWeek(w);
        setTodaySessions(t);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleSessionChange(sessionId, completion) {
    setTodaySessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, completion } : s)));
    setWeek((prev) => {
      if (!prev) return prev;
      const sessions = prev.sessions.map((s) => (s.id === sessionId ? { ...s, completion } : s));
      const total = sessions.filter((s) => s.discipline !== "RACE").length;
      const done = sessions.filter((s) => s.discipline !== "RACE" && s.completion?.completed).length;
      return { ...prev, sessions, completionPct: total ? Math.round((done / total) * 100) : 0, completedCount: done, totalCount: total };
    });
  }

  const byDay = useMemo(() => {
    if (!week) return [];
    const map = new Map();
    for (const s of week.sessions) {
      const key = s.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  }, [week]);

  const todayKey = localTodayKey();

  if (loading) return <div className="text-gray-500 text-sm py-12 text-center">Loading today's plan...</div>;
  if (!week) return <div className="text-gray-500 text-sm py-12 text-center">No week found for today's date.</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting(ATHLETE_NAME)}
            <span className="text-usa-red">.</span>
          </h1>
          <div className="text-xs uppercase tracking-wider text-gray-500 mt-1">
            {DAY_NAMES[new Date().getDay()]}, {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })} · Week {week.weekNumber} of 21 · {week.phase.name}
          </div>
          {week.focus && <p className="text-sm text-gray-400 mt-1 max-w-xl">{week.focus}</p>}
        </div>
        <div className="flex items-center gap-2">
          <RecoveryBadge />
          <div className="flex items-center gap-3 bg-surface-2 border border-usa-blue/25 rounded-xl px-4 py-2">
            <ComplianceRing pct={week.completionPct} />
            <div className="text-xs text-gray-400">
              <div className="text-white font-semibold">{week.completedCount}/{week.totalCount}</div>
              sessions this week
            </div>
          </div>
        </div>
      </div>

      <WeatherStrip />

      <div className="flex items-center justify-between gap-2 no-print">
        <div className="flex gap-1 bg-surface-2 border border-border rounded-lg p-1 w-fit">
          <button
            onClick={() => setView("today")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${view === "today" ? "bg-surface-3 text-white" : "text-gray-500"}`}
          >
            Today
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${view === "week" ? "bg-surface-3 text-white" : "text-gray-500"}`}
          >
            This Week
          </button>
        </div>
        {view === "week" && <PrintButton label="Print This Week" />}
      </div>

      {view === "today" ? (
        <div className="space-y-2">
          {todaySessions.length === 0 && <div className="text-sm text-gray-500">No sessions scheduled today. Rest up.</div>}
          {todaySessions.map((s) => (
            <SessionCard key={s.id} session={s} onChange={handleSessionChange} />
          ))}
        </div>
      ) : (
        <div id="print-week" className="space-y-4">
          {byDay.map(([dateKey, sessions]) => {
            const d = new Date(dateKey + "T00:00:00Z");
            const isToday = dateKey === todayKey;
            return (
              <div key={dateKey}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isToday ? "text-white" : "text-gray-500"}`}>
                  {DAY_NAMES[d.getUTCDay()]} {d.getUTCMonth() + 1}/{d.getUTCDate()} {isToday && "· Today"}
                </div>
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <SessionCard key={s.id} session={s} onChange={handleSessionChange} compact />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
