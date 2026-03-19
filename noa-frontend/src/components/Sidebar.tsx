import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarRange,
  HeartPulse,
  LayoutDashboard,
  Microscope,
  TimerReset,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/athletes", label: "Athletes", icon: Users },
  { to: "/sessions", label: "Sessions", icon: Activity },
  { to: "/biomarkers", label: "Biomarkers", icon: HeartPulse },
  { to: "/planning", label: "Planning", icon: CalendarRange },
  { to: "/risk", label: "Risk", icon: AlertTriangle },
  { to: "/performance-tests", label: "Performance Tests", icon: Microscope },
  { to: "/daily-loads", label: "Daily Loads", icon: BarChart3 },
  { to: "/nlss", label: "NLSS", icon: TimerReset },
];

export default function Sidebar() {
  return (
    <aside className="hidden h-screen w-72 border-r border-noa-line bg-noa-panel/90 xl:flex xl:flex-col">
      <div className="flex h-full flex-col overflow-hidden px-5 py-6 backdrop-blur">
        <div className="mb-6 shrink-0">
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

        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
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
                      : "text-noa-muted hover:bg-noa-panel2 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-4 shrink-0 panel p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">System</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-white">Backend</span>
            <span className="rounded-full bg-noa-success/15 px-3 py-1 text-xs font-semibold text-noa-success">
              Online
            </span>
          </div>
          <p className="mt-3 text-sm text-noa-muted">FastAPI + PostgreSQL + TimescaleDB</p>
        </div>
      </div>
    </aside>
  );
}
