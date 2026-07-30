import { useEffect, useState } from "react";
import { getCurrentWeek, getTodaySessions, getDailyMetrics, getHomeWeather } from "../api/client";
import SessionCard from "../components/SessionCard";
import ReadinessBanner from "../components/ReadinessBanner";
import ReadinessCharts from "../components/ReadinessCharts";
import RecommendationsList from "../components/RecommendationsList";
import WeatherBoard from "../components/WeatherBoard";
import WhoopWorkoutsWidget from "../components/WhoopWorkoutsWidget";
import { greeting } from "../lib/date";

const ATHLETE_NAME = "Dante";

export default function Home() {
  const [week, setWeek] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCurrentWeek(), getTodaySessions()])
      .then(([w, t]) => {
        setWeek(w);
        setTodaySessions(t);
      })
      .finally(() => setLoading(false));

    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
    getDailyMetrics(start, end)
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setMetricsLoading(false));

    getHomeWeather()
      .then(setWeather)
      .catch(() => {})
      .finally(() => setWeatherLoading(false));
  }, []);

  function handleSessionChange(sessionId, completion) {
    setTodaySessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, completion } : s)));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting(ATHLETE_NAME)}
            <span className="text-usa-red">.</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            The full view — built for a bigger screen. The Today tab has the same checklist, streamlined for your phone.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        {/* Main column: today's workouts + recommendations */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Today's Training</h2>
          {loading ? (
            <div className="text-sm text-gray-500">Loading today's plan...</div>
          ) : (
            <div className="space-y-2">
              {todaySessions.length === 0 && <div className="text-sm text-gray-500">No sessions scheduled today. Rest up.</div>}
              {todaySessions.map((s) => (
                <SessionCard key={s.id} session={s} onChange={handleSessionChange} />
              ))}
              {!weatherLoading && todaySessions.length > 0 && <RecommendationsList sessions={todaySessions} weather={weather} />}
            </div>
          )}
        </div>

        {/* Sidebar: readiness, weather, whoop activities */}
        <div className="lg:col-span-1 space-y-4">
          <ReadinessBanner metrics={metrics} loading={metricsLoading} />
          <WeatherBoard weather={weather} loading={weatherLoading} />
          <WhoopWorkoutsWidget />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Readiness Trends</h2>
        <ReadinessCharts metrics={metrics} loading={metricsLoading} />
      </div>
    </div>
  );
}
