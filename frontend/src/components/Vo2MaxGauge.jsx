import { useMemo, useState } from "react";
import { fmtUTC } from "../lib/date";
import { NORM_LABEL, ordinal, vo2Percentile } from "../lib/vo2Norms";

// USA palette from index.css: blue = the measurement, red = the personal-best marker,
// white = the "you are here" dot and numbers.
const BLUE = "#3b82f6";
const RED = "#ef4444";
const WHITE = "#f8fafc";
const TRACK = "#2a2b30";
const CARD_BG = "#0e0f12";
const DAY = 86400000;
const EMPTY_MESSAGE =
  "No VO2 max yet. Run a Garmin sync (Fitness page). It appears once your watch has updated it on a qualifying run or ride.";

const shortDate = (d) => fmtUTC(d, { month: "short", day: "numeric" });
const longDate = (d) => fmtUTC(d, { month: "short", day: "numeric", year: "numeric" });
const fmt = (v) => v.toFixed(1);
const fmtDelta = (d) => `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d).toFixed(1)}`;
const arrowFor = (d) => (d > 0 ? "▲" : d < 0 ? "▼" : "▬");
const wordFor = (d) => (d > 0 ? "up" : d < 0 ? "down" : "unchanged");

function summarize(readings) {
  const pts = readings.map((r) => ({ ...r, t: new Date(r.date).getTime() })).sort((a, b) => a.t - b.t);
  if (!pts.length) return null;
  const latest = pts[pts.length - 1];
  const best = pts.reduce((m, p) => (p.value >= m.value ? p : m), pts[0]);
  let base = null;
  for (const p of pts) if (p.t <= latest.t - 30 * DAY) base = p;
  return {
    pts,
    latest,
    best,
    n: pts.length,
    isBest: latest.value >= best.value,
    change30: base ? Math.round((latest.value - base.value) * 10) / 10 : null,
  };
}

// Fixed 30-80 scale so the arc fills the same way over time.
const G = { cx: 110, cy: 110, r: 86, min: 30, max: 80 };
const gAngle = (v) => Math.PI * (1 - Math.min(1, Math.max(0, (v - G.min) / (G.max - G.min))));
const gPoint = (v, r = G.r) => ({ x: G.cx + r * Math.cos(gAngle(v)), y: G.cy - r * Math.sin(gAngle(v)) });
const gArc = (v) => {
  const a = gPoint(G.min);
  const b = gPoint(v);
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} A${G.r},${G.r} 0 0 1 ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
};

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-usa-blue";
const chipCls = "inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2 py-1 text-xs text-gray-200";
const shell = "w-full bg-surface-2 border border-border rounded-xl p-4";
const Label = () => <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">VO2 Max</h3>;

function GaugeTrack({ children, label }) {
  return (
    <svg viewBox="0 0 220 136" className="mx-auto mt-3 block w-full max-w-[260px]" role="img" aria-label={label}>
      <path d={gArc(G.max)} fill="none" stroke={TRACK} strokeWidth="14" strokeLinecap="round" />
      <text x={G.cx - G.r} y="130" textAnchor="middle" fontSize="10" fill="#6b7280">{G.min}</text>
      <text x={G.cx + G.r} y="130" textAnchor="middle" fontSize="10" fill="#6b7280">{G.max}</text>
      {children}
    </svg>
  );
}

function Percentile({ value }) {
  const pct = vo2Percentile(value);
  if (!pct) return null;
  const headline =
    pct.bound === "above" ? `Above the ${ordinal(pct.p)}` : pct.bound === "below" ? `Below the ${ordinal(pct.p)}` : `~${ordinal(pct.p)}`;
  const detail =
    pct.bound === "above"
      ? `Higher than at least ${pct.p} of 100 ${NORM_LABEL}`
      : pct.bound === "below"
        ? `Lower than at least ${100 - pct.p} of 100 ${NORM_LABEL}`
        : `Higher than about ${pct.p} of 100 ${NORM_LABEL}`;
  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums text-white">{headline}</span>
          <span className="text-xs text-gray-400">percentile</span>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-gray-500">vs {NORM_LABEL}</span>
      </div>
      <div
        className="relative mt-2 h-2 rounded-full"
        style={{ background: TRACK }}
        role="img"
        aria-label={`${headline} percentile for ${NORM_LABEL}`}
      >
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct.p}%`, background: BLUE }} />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ left: `${pct.p}%`, background: WHITE, borderColor: CARD_BG }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-500" aria-hidden="true">
        <span>0</span>
        <span>50th</span>
        <span>100</span>
      </div>
      <p className="mt-2 text-xs text-gray-400">{detail}</p>
      <details className="mt-1 text-[11px] text-gray-500">
        <summary className={`cursor-pointer select-none rounded hover:text-gray-300 ${focusRing}`}>About this comparison</summary>
        <p className="mt-1 leading-snug">
          Percentiles come from the FRIEND Registry (2022): lab-tested treadmill VO2 max in healthy US adults. It is not a worldwide
          sample, the youngest published group is 20–29 (you are 18), and Garmin's number is a watch estimate rather than a lab test.
          Treat it as a rough guide, not a ranking.
        </p>
      </details>
    </div>
  );
}

function DataDetails({ pts, bestT }) {
  return (
    <details className="mt-3 text-xs text-gray-500">
      <summary className={`cursor-pointer select-none rounded hover:text-gray-300 ${focusRing}`}>
        View data ({pts.length} {pts.length === 1 ? "reading" : "readings"})
      </summary>
      <div className="mt-2 max-h-40 overflow-y-auto">
        <table className="w-full text-left">
          <caption className="sr-only">VO2 max readings in ml/kg/min, newest first</caption>
          <thead className="sticky top-0 bg-surface-2 text-[10px] uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" className="py-1 pr-2 font-medium">Date</th>
              <th scope="col" className="py-1 pr-2 font-medium">VO2 max</th>
              <th scope="col" className="py-1 font-medium"><span className="sr-only">Note</span></th>
            </tr>
          </thead>
          <tbody>
            {[...pts].reverse().map((p) => (
              <tr key={p.date}>
                <td className="py-0.5 pr-2 text-gray-400">{longDate(p.date)}</td>
                <td className="py-0.5 pr-2 tabular-nums text-gray-200">{fmt(p.value)}</td>
                <td className="py-0.5 text-red-300">{p.t === bestT ? "★ best" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// readings: [{ date: "YYYY-MM-DD" or ISO, value: number }]
export function Vo2Gauge({ readings }) {
  const s = useMemo(() => summarize(readings), [readings]);
  const [hk, setHk] = useState(null); // "latest" | "best" | null

  if (!s) {
    return (
      <div className={shell}>
        <Label />
        <GaugeTrack label="Empty VO2 max gauge, no readings yet">
          <text x={G.cx} y="100" textAnchor="middle" fontSize="40" fontWeight="700" fill="#4b5563">–</text>
          <text x={G.cx} y="118" textAnchor="middle" fontSize="10" fill="#6b7280">ml/kg/min</text>
        </GaugeTrack>
        <p className="mt-2 text-center text-sm text-gray-500">{EMPTY_MESSAGE}</p>
      </div>
    );
  }

  const latestPt = gPoint(s.latest.value);
  // Personal best sits outside the arc as a small triangle so it never collides with the
  // latest marker, even when the two values are nearly equal.
  const th = gAngle(s.best.value);
  const u = { x: Math.cos(th), y: -Math.sin(th) };
  const tg = { x: -Math.sin(th), y: -Math.cos(th) };
  const at = (R, off = 0) => `${(G.cx + R * u.x + off * tg.x).toFixed(1)},${(G.cy + R * u.y + off * tg.y).toFixed(1)}`;
  const bestTri = `M${at(G.r + 9)} L${at(G.r + 19, 4.5)} L${at(G.r + 19, -4.5)} Z`;
  const bestHit = gPoint(s.best.value, G.r + 14);
  const showBest = s.n > 1 && !s.isBest;

  const caption =
    hk === "best" ? `Personal best · ${shortDate(s.best.date)} · ${fmt(s.best.value)}`
    : hk === "latest" ? `Latest · ${shortDate(s.latest.date)} · ${fmt(s.latest.value)}`
    : s.n === 1 ? `First reading · ${shortDate(s.latest.date)}`
    : `Latest · ${shortDate(s.latest.date)}`;

  const markerProps = (key, name) => ({
    tabIndex: 0,
    role: "img",
    "aria-label": name,
    className: "cursor-pointer outline-none [&:focus-visible_.ring]:stroke-usa-blue",
    onPointerEnter: () => setHk(key),
    onPointerLeave: () => setHk(null),
    onFocus: () => setHk(key),
    onBlur: () => setHk(null),
  });

  return (
    <div className={shell}>
      <div className="flex items-start justify-between gap-3">
        <Label />
        {s.isBest && s.n > 1 && (
          <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">
            ★ Personal best
          </span>
        )}
      </div>

      <GaugeTrack label={`VO2 max gauge on a 30 to 80 scale. Latest ${fmt(s.latest.value)}${showBest ? `, personal best ${fmt(s.best.value)}` : ""}.`}>
        {[40, 50, 60, 70].map((v) => (
          <line key={v} x1={gPoint(v, G.r + 10).x} y1={gPoint(v, G.r + 10).y} x2={gPoint(v, G.r + 14).x} y2={gPoint(v, G.r + 14).y} stroke="#4b5563" strokeWidth="1" />
        ))}
        <path d={gArc(s.latest.value)} fill="none" stroke={BLUE} strokeWidth="14" strokeLinecap="round" />
        <text x={G.cx} y="100" textAnchor="middle" fontSize="40" fontWeight="700" fill={WHITE} style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(s.latest.value)}</text>
        <text x={G.cx} y="118" textAnchor="middle" fontSize="10" fill="#9ca3af">ml/kg/min</text>

        {showBest && (
          <g {...markerProps("best", `Personal best ${fmt(s.best.value)} on ${longDate(s.best.date)}`)}>
            <circle cx={bestHit.x} cy={bestHit.y} r="13" fill="transparent" />
            <path d={bestTri} fill={RED} stroke={RED} strokeWidth="1.75" strokeLinejoin="round" className="ring" />
          </g>
        )}
        <g {...markerProps("latest", `Latest ${fmt(s.latest.value)} on ${longDate(s.latest.date)}`)}>
          <circle cx={latestPt.x} cy={latestPt.y} r="14" fill="transparent" />
          <circle cx={latestPt.x} cy={latestPt.y} r="8" fill={WHITE} stroke={BLUE} strokeWidth="3" className="ring" />
        </g>
      </GaugeTrack>

      <div className="mt-1 h-4 text-center text-xs text-gray-400" aria-live="polite">{caption}</div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {s.change30 == null ? (
          <span className={chipCls}>No reading 30+ days old yet</span>
        ) : (
          <span className={chipCls}>
            <span aria-hidden="true" style={{ color: BLUE }}>{arrowFor(s.change30)}</span>
            <span className="sr-only">{wordFor(s.change30)} </span>
            {fmtDelta(s.change30)} vs 30 days ago
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
        <span><span style={{ color: WHITE }} aria-hidden="true">●</span> Latest {fmt(s.latest.value)}</span>
        {showBest && (
          <span><span style={{ color: RED }} aria-hidden="true">▼</span> Best {fmt(s.best.value)} · {shortDate(s.best.date)}</span>
        )}
      </div>

      <Percentile value={s.latest.value} />
      <DataDetails pts={s.pts} bestT={s.best.t} />
    </div>
  );
}

// Home sidebar entry point: takes daily-metric rows with garminVo2Max.
export default function Vo2MaxGauge({ rows = [], loading }) {
  const readings = useMemo(
    () => rows.filter((r) => r.garminVo2Max != null).map((r) => ({ date: r.date, value: r.garminVo2Max })),
    [rows],
  );
  if (loading) {
    return (
      <div className={shell}>
        <div className="text-sm text-gray-500">Loading VO2 max...</div>
      </div>
    );
  }
  return <Vo2Gauge readings={readings} />;
}
