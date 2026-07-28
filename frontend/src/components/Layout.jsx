import { NavLink, Outlet } from "react-router-dom";
import BatIcon from "./BatIcon";

const NAV_ITEMS = [
  { to: "/", label: "Today", icon: "📋", end: true },
  { to: "/timeline", label: "Timeline", icon: "📈" },
  { to: "/fitness", label: "Fitness", icon: "📊" },
  { to: "/race-day", label: "Race Day", icon: "🏁" },
  { to: "/templates", label: "Templates", icon: "🗂️" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

function navClass({ isActive }) {
  return `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? "bg-surface-3 text-bat" : "text-gray-400 hover:text-white hover:bg-surface-2"
  }`;
}

function mobileNavClass({ isActive }) {
  return `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
    isActive ? "text-bat" : "text-gray-500"
  }`;
}

export default function Layout() {
  return (
    <div className="min-h-svh flex flex-col bg-surface">
      <header className="no-print relative sticky top-0 z-20 border-b border-bat/20 bg-surface/95 backdrop-blur overflow-hidden">
        <div className="bat-spotlight" />
        <div className="relative mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BatIcon className="h-6 w-6 shrink-0 text-bat drop-shadow-[0_0_6px_rgba(255,199,44,0.5)]" />
            <div>
              <div className="text-sm font-bold tracking-tight text-white">
                70.3 <span className="text-bat">FLORIDA</span> BUILD
              </div>
              <div className="text-[11px] text-gray-500">Dec 13, 2026 · Haines City, FL</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-4 pb-20 md:pb-8">
        <Outlet />
      </main>

      <nav className="no-print md:hidden fixed bottom-0 inset-x-0 z-20 flex border-t border-bat/20 bg-surface-2/95 backdrop-blur">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={mobileNavClass}>
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
