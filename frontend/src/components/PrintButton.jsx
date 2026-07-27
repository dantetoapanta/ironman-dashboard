export default function PrintButton({ label = "Print / Export PDF" }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-1.5 bg-surface-3 border border-border text-gray-200 text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-surface-2"
    >
      🖨️ {label}
    </button>
  );
}
