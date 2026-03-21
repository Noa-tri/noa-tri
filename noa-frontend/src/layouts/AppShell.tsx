import { Activity, CalendarDays, Gauge, RefreshCcw, ShieldAlert, Users, Building2 } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/athletes", label: "Athletes", icon: Users },
  { to: "/planning", label: "Planning", icon: CalendarDays },
  { to: "/sessions", label: "Sessions", icon: Activity },
  { to: "/biomarkers", label: "Biomarkers", icon: Activity },
  { to: "/risk", label: "Risk", icon: ShieldAlert },
  { to: "/synchronization", label: "Synchronization", icon: RefreshCcw },
];

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[290px] shrink-0 border-r border-cyan-500/10 bg-[#07111c] lg:block">
          <div className="flex h-full flex-col px-4 py-5">
            <div className="mb-8 rounded-[28px] border border-cyan-500/20 bg-[#0a1728] p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">NOA TRI</p>
              <h1 className="mt-3 text-2xl font-semibold text-white">Adaptive Performance System</h1>
              <p className="mt-3 text-sm text-slate-400">High performance operations</p>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-white/5 text-slate-200 hover:bg-white/10"
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
              <p className="mt-2 text-sm text-slate-300">AppShell con navegación por rutas real</p>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="mx-auto max-w-[1600px] px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
