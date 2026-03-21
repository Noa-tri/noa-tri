import { Activity, Building2, CalendarDays, Gauge, RefreshCcw, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/athletes", label: "Athletes", icon: Users },
  { to: "/planning", label: "Planning", icon: CalendarDays },
  { to: "/sessions", label: "Sessions", icon: Activity },
  { to: "/biomarkers", label: "Metrics", icon: Activity },
  { to: "/synchronization", label: "Synchronization", icon: RefreshCcw },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-white/10 bg-[#08101d] lg:block">
      <div className="flex h-full flex-col px-4 py-5">
        <div className="mb-8 rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/10 to-transparent p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">NOA TRI</p>
          <h1 className="mt-2 text-2xl font-semibold">Adaptive Performance System</h1>
          <p className="mt-3 text-sm text-slate-300">High performance operations</p>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    isActive
                      ? "bg-cyan-400 text-slate-950"
                      : "border border-white/5 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
          <p className="mt-2 text-sm text-slate-200">Frontend operativo con navegación real</p>
        </div>
      </div>
    </aside>
  );
}
