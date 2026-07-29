// Whoop's own recovery color convention (green/yellow/red) is a widely
// recognized health signal — kept separate from the site's red/white/blue
// decorative theme since it carries real meaning (this is "go/caution/stop").
export function recoveryColor(score) {
  if (score == null) return { text: "text-gray-400", bg: "bg-gray-500/15", ring: "#6b7280" };
  if (score >= 67) return { text: "text-green-400", bg: "bg-green-500/15", ring: "#22c55e" };
  if (score >= 34) return { text: "text-yellow-400", bg: "bg-yellow-500/15", ring: "#eab308" };
  return { text: "text-red-400", bg: "bg-red-500/15", ring: "#ef4444" };
}

// Picks the most recent day (by date, descending) that has a given field set.
export function latestWithField(metrics, field) {
  for (let i = metrics.length - 1; i >= 0; i--) {
    if (metrics[i][field] != null) return metrics[i];
  }
  return null;
}

// Same thresholds as recoveryColor (67+/34-66/<34) — adjust both together if tuning.
export function readinessBanner(score) {
  if (score == null) {
    return { level: "unknown", bg: "bg-surface-3", border: "border-border", text: "text-gray-400", message: "Recovery not synced yet today." };
  }
  if (score >= 67) {
    return { level: "green", bg: "bg-green-500/10", border: "border-green-500/40", text: "text-green-400", message: "Green light — go as planned." };
  }
  if (score >= 34) {
    return { level: "amber", bg: "bg-yellow-500/10", border: "border-yellow-500/40", text: "text-yellow-400", message: "Amber — consider trimming intensity today." };
  }
  return { level: "red", bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-400", message: "Red — consider an easy day or swapping to rest." };
}
