import { NavLink, Outlet } from "react-router-dom";
import StarIcon from "./StarIcon";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "🏠", end: true },
  { to: "/today", label: "Today", icon: "📋" },
  { to: "/timeline", label: "Timeline", icon: "📈" },
  { to: "/fitness", label: "Fitness", icon: "📊" },
  { to: "/race-day", label: "Race Day", icon: "🏁" },
  { to: "/templates", label: "Templates", icon: "🗂️" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

function navClass({ isActive }) {
  return `flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
    isActive ? "bg-surface-3 text-usa-red" : "text-gray-400 hover:text-white hover:bg-surface-2"
  }`;
}

function mobileNavClass({ isActive }) {
  return `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
    isActive ? "text-usa-red" : "text-gray-500"
  }`;
}

export default function Layout() {
  return (
    <div className="min-h-svh flex flex-col bg-surface">
      <header className="no-print relative sticky top-0 z-20 border-b border-usa-blue/25 bg-surface/95 backdrop-blur overflow-hidden">
        <div className="hero-glow" />
        <div className="relative mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <StarIcon className="h-5 w-5 shrink-0 text-usa-white drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
            <div className="whitespace-nowrap">
              <div className="text-sm font-bold tracking-tight text-white">
                70.3 <span className="text-usa-red">FLORIDA</span> <span className="text-usa-blue">BUILD</span>
              </div>
              <div className="text-[11px] text-gray-500 hidden sm:block">Dec 13, 2026 · Haines City, FL</div>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-4 pb-20 lg:pb-8">
        <Outlet />
      </main>

      <nav className="no-print lg:hidden fixed bottom-0 inset-x-0 z-20 flex border-t border-usa-blue/25 bg-surface-2/95 backdrop-blur overflow-x-auto">
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
