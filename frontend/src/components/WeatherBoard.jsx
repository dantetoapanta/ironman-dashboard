import { weatherIcon } from "../lib/weatherIcon";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeatherBoard({ weather, loading }) {
  if (loading) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <div className="text-sm text-gray-500">Loading weather...</div>
      </div>
    );
  }
  if (!weather?.current) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <div className="text-sm text-gray-500">Weather unavailable right now.</div>
      </div>
    );
  }

  const days = (weather.daily?.time || []).slice(0, 5);

  return (
    <div className="bg-surface-2 border border-usa-blue/25 rounded-xl p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-white text-sm">{weather.location}</h2>
        <span className="text-[10px] uppercase tracking-wider text-gray-500">{weather.reason}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-4xl">{weatherIcon(weather.current.weather_code)}</span>
        <div>
          <div className="text-2xl font-bold text-white">{Math.round(weather.current.temperature_2m)}°F</div>
          <div className="text-xs text-gray-400">
            Feels {Math.round(weather.current.apparent_temperature)}°F · {weather.current.relative_humidity_2m}% humidity
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 pt-2 border-t border-border">
        {days.map((dateStr, i) => {
          const d = new Date(dateStr + "T00:00:00");
          const hi = weather.daily.temperature_2m_max[i];
          const lo = weather.daily.temperature_2m_min[i];
          return (
            <div key={dateStr} className="text-center">
              <div className="text-[10px] text-gray-500 uppercase">{i === 0 ? "Today" : DAY_ABBR[d.getDay()]}</div>
              <div className="text-base">{weatherIcon(weather.daily.weather_code[i])}</div>
              <div className="text-[11px] text-white font-medium">{Math.round(hi)}°</div>
              <div className="text-[10px] text-gray-500">{Math.round(lo)}°</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
