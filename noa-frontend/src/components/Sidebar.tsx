import {
  Activity,
  AlertTriangle,
  CalendarRange,
  HeartPulse,
  LayoutDashboard,
  TimerReset,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/athletes", label: "Athletes", icon: Users },
  { to: "/sessions", label: "Sessions", icon: Activity },
  { to: "/biomarkers", label: "Biomarkers", icon: HeartPulse },
  { to: "/planning", label: "Planning", icon: CalendarRange },
  { to: "/risk", label: "Risk", icon: AlertTriangle },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-72 border-r border-noa-line bg-noa-panel/90 px-5 py-6 backdrop-blur xl:flex xl:flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-noa-accent to-noa-blue text-slate-950 shadow-glow">
            <TimerReset size={20} strokeWidth={2.5} />
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-wide text-white">NOA TRI</h1>
            <p className="text-sm text-noa-muted">Adaptive Performance System</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-2xl px-4 py-3 transition-all",
                  isActive
                    ? "bg-gradient-to-r from-noa-accent/20 to-noa-blue/20 text-white ring-1 ring-white/10"
                    : "text-noa-muted hover:bg-noa-panel2 hover:text-white"
                ].join(" ")
              }
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">System</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-white">Backend</span>
          <span className="rounded-full bg-noa-success/15 px-3 py-1 text-xs font-semibold text-noa-success">
            Online
          </span>
        </div>
        <p className="mt-3 text-sm text-noa-muted">FastAPI + PostgreSQL + TimescaleDB</p>
      </div>
    </aside>
  );
}
