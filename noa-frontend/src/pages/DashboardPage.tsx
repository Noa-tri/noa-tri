import { ArrowUpRight, HeartPulse, ShieldAlert, TimerReset, Zap } from "lucide-react";

const metricCards = [
  {
    title: "CTL",
    value: "78",
    change: "+4.2%",
    icon: TimerReset,
    accent: "text-noa-accent",
  },
  {
    title: "ATL",
    value: "91",
    change: "+6.8%",
    icon: Zap,
    accent: "text-noa-blue",
  },
  {
    title: "TSB",
    value: "-13",
    change: "Fatigue",
    icon: ArrowUpRight,
    accent: "text-noa-warning",
  },
  {
    title: "HRV",
    value: "62",
    change: "Stable",
    icon: HeartPulse,
    accent: "text-noa-success",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-8 p-6 md:grid-cols-[1.35fr_0.65fr] md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Performance Overview</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-white">
              Intelligent coaching for elite triathlon performance.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-noa-muted">
              Analyze training load, recovery biomarkers, adaptive planning and execution quality
              from one command center.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-gradient-to-r from-noa-accent to-noa-blue px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow">
                Sync Garmin
              </button>
              <button className="rounded-2xl border border-noa-line bg-noa-panel2 px-5 py-3 text-sm font-semibold text-white">
                Open athlete profile
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/5 bg-gradient-to-br from-noa-panel2 to-noa-bg p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">Readiness Signal</p>
              <span className="rounded-full bg-noa-success/15 px-3 py-1 text-xs font-semibold text-noa-success">
                Optimized
              </span>
            </div>

            <div className="mt-8 flex items-end gap-3">
              <div className="text-6xl font-bold tracking-tight text-white">84</div>
              <div className="pb-2 text-sm text-noa-muted">/ 100</div>
            </div>

            <p className="mt-4 text-sm leading-6 text-noa-muted">
              Current athlete state suggests productive training load with acceptable recovery
              trend and controlled physiological risk.
            </p>

            <div className="mt-6 h-32 rounded-2xl border border-noa-line bg-hero-grid bg-[size:20px_20px]" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} className="metric-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-noa-muted">{card.title}</p>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-white">{card.value}</p>
                  <p className="mt-2 text-sm text-noa-muted">{card.change}</p>
                </div>

                <div className={`rounded-2xl bg-noa-panel2 p-3 ${card.accent}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">Load & Adaptation</p>
              <p className="mt-1 text-sm text-noa-muted">
                CTL / ATL / TSB visualization area
              </p>
            </div>

            <span className="rounded-full border border-noa-line bg-noa-panel2 px-3 py-1 text-xs font-semibold text-noa-muted">
              6 weeks
            </span>
          </div>

          <div className="mt-6 flex h-[340px] items-center justify-center rounded-[28px] border border-dashed border-noa-line bg-noa-panel2 text-noa-muted">
            Chart area
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-noa-danger/10 p-3 text-noa-danger">
                <ShieldAlert size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Risk Engine</p>
                <p className="text-sm text-noa-muted">Current physiological alerting state</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-noa-muted">Acute fatigue</span>
                  <span className="text-sm font-semibold text-noa-warning">Moderate</span>
                </div>
              </div>

              <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-noa-muted">Recovery drift</span>
                  <span className="text-sm font-semibold text-noa-success">Low</span>
                </div>
              </div>

              <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-noa-muted">Execution mismatch</span>
                  <span className="text-sm font-semibold text-noa-blue">Tracked</span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <p className="text-lg font-semibold text-white">Next Build</p>
            <p className="mt-2 text-sm leading-6 text-noa-muted">
              En el próximo paso conectamos navegación real de Athletes, Sessions, Biomarkers y
              Planning con páginas separadas, manteniendo este diseño premium.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
