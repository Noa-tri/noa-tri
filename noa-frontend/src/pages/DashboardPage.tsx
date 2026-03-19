import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarRange,
  HeartPulse,
  Microscope,
  TimerReset,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { apiGet } from "../lib/api";
import type { TeamDashboardAthlete } from "../types/dashboard";

function avg(values: Array<number | null | undefined>): string {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length === 0) {
    return "--";
  }

  const total = valid.reduce((sum, value) => sum + value, 0);
  return (total / valid.length).toFixed(1);
}

function sum(values: Array<number | null | undefined>): string {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length === 0) {
    return "--";
  }

  const total = valid.reduce((acc, value) => acc + value, 0);
  return total.toFixed(1);
}

function riskBadgeClass(risk: string | null): string {
  const value = (risk ?? "").toLowerCase();

  if (value.includes("high") || value.includes("alert") || value.includes("severe")) {
    return "bg-noa-danger/15 text-noa-danger";
  }

  if (value.includes("moderate") || value.includes("controlled") || value.includes("medium")) {
    return "bg-noa-warning/15 text-noa-warning";
  }

  if (value.includes("low") || value.includes("optimal") || value.includes("stable")) {
    return "bg-noa-success/15 text-noa-success";
  }

  return "bg-noa-blue/15 text-noa-blue";
}

const quickLinks = [
  {
    to: "/organizations",
    title: "Organizations",
    description: "Create team structures before adding athletes.",
    icon: Building2,
  },
  {
    to: "/athletes",
    title: "Athletes",
    description: "Create athletes and open their coach profile.",
    icon: Users,
  },
  {
    to: "/planning",
    title: "Planning",
    description: "Create and review planned training sessions.",
    icon: CalendarRange,
  },
  {
    to: "/performance-tests",
    title: "Performance Tests",
    description: "Register tests used for model calibration.",
    icon: Microscope,
  },
  {
    to: "/daily-loads",
    title: "Daily Loads",
    description: "Inspect aggregated daily load by sport.",
    icon: BarChart3,
  },
  {
    to: "/nlss",
    title: "NLSS",
    description: "Calibrate physiological model parameters.",
    icon: TimerReset,
  },
];

export default function DashboardPage() {
  const [teamData, setTeamData] = useState<TeamDashboardAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setPageError(null);

      const data = await apiGet<TeamDashboardAthlete[]>("/dashboard/team");
      setTeamData(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    return {
      athleteCount: teamData.length,
      avgCtl: avg(teamData.map((item) => item.ctl)),
      avgAtl: avg(teamData.map((item) => item.atl)),
      avgHrv: avg(teamData.map((item) => item.hrv_rmssd)),
      weeklyTss: sum(teamData.map((item) => item.weekly_total_tss)),
    };
  }, [teamData]);

  const topAthletes = useMemo(() => {
    return [...teamData]
      .sort((a, b) => (b.weekly_total_tss ?? 0) - (a.weekly_total_tss ?? 0))
      .slice(0, 5);
  }, [teamData]);

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Coach Command Center</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-white">
              NOA TRI operational dashboard for coaching, planning and modeling.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-noa-muted">
              Usá este panel como punto de entrada real del producto: estructura, atletas,
              planificación, sesiones, carga diaria y calibración NLSS.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={loadDashboard}
                className="rounded-2xl bg-gradient-to-r from-noa-accent to-noa-blue px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow"
              >
                Refresh dashboard
              </button>

              <Link
                to="/organizations"
                className="rounded-2xl border border-noa-line bg-noa-panel2 px-5 py-3 text-sm font-semibold text-white"
              >
                Start with organizations
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/5 bg-gradient-to-br from-noa-panel2 to-noa-bg p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">Team state</p>
              <span className="rounded-full bg-noa-success/15 px-3 py-1 text-xs font-semibold text-noa-success">
                Live
              </span>
            </div>

            <div className="mt-8 flex items-end gap-3">
              <div className="text-6xl font-bold tracking-tight text-white">{summary.athleteCount}</div>
              <div className="pb-2 text-sm text-noa-muted">athletes</div>
            </div>

            <p className="mt-4 text-sm leading-6 text-noa-muted">
              Aggregated from athlete records, PMC metrics, biomarkers, risk and weekly load.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-noa-line bg-noa-panel p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Avg CTL</p>
                <p className="mt-2 text-2xl font-bold text-white">{summary.avgCtl}</p>
              </div>

              <div className="rounded-2xl border border-noa-line bg-noa-panel p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Weekly TSS</p>
                <p className="mt-2 text-2xl font-bold text-white">{summary.weeklyTss}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {pageError && (
        <section className="rounded-3xl border border-noa-danger/30 bg-noa-danger/10 p-6 text-sm text-noa-danger">
          {pageError}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-noa-muted">Athletes</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-white">{summary.athleteCount}</p>
            </div>
            <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-accent">
              <Activity size={18} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-noa-muted">Avg CTL</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-white">{summary.avgCtl}</p>
            </div>
            <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-blue">
              <TimerReset size={18} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-noa-muted">Avg ATL</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-white">{summary.avgAtl}</p>
            </div>
            <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-warning">
              <Zap size={18} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-noa-muted">Avg HRV</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-white">{summary.avgHrv}</p>
            </div>
            <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-success">
              <HeartPulse size={18} />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-noa-muted">Weekly TSS</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-white">{summary.weeklyTss}</p>
            </div>
            <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-accent">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">Recommended test flow</p>
              <p className="mt-1 text-sm text-noa-muted">
                Usá este orden para probar el producto de punta a punta.
              </p>
            </div>

            <span className="rounded-full border border-noa-line bg-noa-panel2 px-3 py-1 text-xs font-semibold text-noa-muted">
              Guided
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-3xl border border-noa-line bg-noa-panel2 p-5 transition hover:border-white/15 hover:bg-noa-panel"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-noa-panel p-3 text-noa-accent">
                      <Icon size={18} />
                    </div>

                    <ArrowUpRight size={16} className="text-noa-muted" />
                  </div>

                  <p className="mt-4 text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-noa-muted">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-noa-danger/10 p-3 text-noa-danger">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Risk overview</p>
                <p className="text-sm text-noa-muted">Latest team risk state</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {topAthletes.length === 0 ? (
                <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4 text-sm text-noa-muted">
                  No dashboard data available.
                </div>
              ) : (
                topAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="rounded-2xl border border-noa-line bg-noa-panel2 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{athlete.name}</p>
                        <p className="mt-1 text-xs text-noa-muted">
                          TSS {athlete.weekly_total_tss ?? "--"} · Monotony {athlete.weekly_monotony ?? "--"}
                        </p>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadgeClass(athlete.risk)}`}>
                        {athlete.risk ?? "--"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel p-6">
            <p className="text-lg font-semibold text-white">Team performance table</p>
            <p className="mt-1 text-sm text-noa-muted">Real values from dashboard team endpoint</p>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-dashed border-noa-line bg-noa-panel2 p-6 text-sm text-noa-muted">
                Loading dashboard...
              </div>
            ) : teamData.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-noa-line bg-noa-panel2 p-6 text-sm text-noa-muted">
                No team data found.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {teamData.slice(0, 5).map((athlete) => (
                  <Link
                    key={athlete.id}
                    to={`/athletes/${athlete.id}`}
                    className="block rounded-2xl border border-noa-line bg-noa-panel2 p-4 transition hover:border-white/15"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{athlete.name}</p>
                        <p className="mt-1 text-xs text-noa-muted">
                          CTL {athlete.ctl ?? "--"} · ATL {athlete.atl ?? "--"} · HRV {athlete.hrv_rmssd ?? "--"}
                        </p>
                      </div>

                      <ArrowUpRight size={16} className="text-noa-muted" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
