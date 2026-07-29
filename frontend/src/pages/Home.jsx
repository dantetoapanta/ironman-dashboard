import { useEffect, useState } from "react";
import { getDailyMetrics, getHomeWeather } from "../api/client";
import ReadinessBanner from "../components/ReadinessBanner";
import ReadinessCharts from "../components/ReadinessCharts";
import WeatherBoard from "../components/WeatherBoard";

export default function Home() {
  const [metrics, setMetrics] = useState([]);
  const [weather, setWeather] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Home</h1>
        <p className="text-sm text-gray-400 mt-1">Readiness trends and conditions — built for a bigger screen. Check the Today tab on your phone for the daily checklist.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2">
          <ReadinessBanner metrics={metrics} loading={metricsLoading} />
        </div>
        <div className="lg:col-span-1">
          <WeatherBoard weather={weather} loading={weatherLoading} />
        </div>
      </div>

      <ReadinessCharts metrics={metrics} loading={metricsLoading} />
    </div>
  );
}
