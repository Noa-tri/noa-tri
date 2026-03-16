import {
  Activity,
  ArrowLeft,
  CalendarRange,
  HeartPulse,
  ShieldAlert,
  TimerReset,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const athleteMap: Record<
  string,
  {
    name: string;
    category: string;
    focus: string;
    readiness: number;
    ctl: number;
    atl: number;
    tsb: number;
    hrv: number;
    restingHr: number;
    fatigue: string;
    risk: string;
  }
> = {
  "lucia-fernandez": {
    name: "Lucía Fernández",
    category: "Elite",
    focus: "Olympic Distance",
    readiness: 84,
    ctl: 84,
    atl: 92,
    tsb: -8,
    hrv: 64,
    restingHr: 47,
    fatigue: "Moderate",
    risk: "Controlled",
  },
  "tomas-rivas": {
    name: "Tomás Rivas",
    category: "Competitive",
    focus: "Ironman",
    readiness: 68,
    ctl: 71,
    atl: 88,
    tsb: -17,
    hrv: 52,
    restingHr: 54,
    fatigue: "High",
    risk: "Alert",
  },
  "valentina-costa": {
    name: "Valentina Costa",
    category: "Elite",
    focus: "Olympic Distance",
    readiness: 89,
    ctl: 79,
    atl: 81,
    tsb: -2,
    hrv: 68,
    restingHr: 45,
    fatigue: "Low",
    risk: "Optimal",
  },
};

export default function AthleteDetailPage() {
  const { athleteId } = useParams();
  const athlete = athleteId ? athleteMap[athleteId] : undefined;

  if (!athlete) {
    return (
      <div className="panel p-8">
        <p className="text-lg font-semibold text-white">Athlete not found</p>
        <Link
          to="/athletes"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-noa-accent"
        >
          <ArrowLeft size={16} />
          Back to athletes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-8 p-6 md:grid-cols-[1.35fr_0.65fr] md:p-8">
          <div>
            <Link
              to="/athletes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-noa-accent"
            >
              <ArrowLeft size={16} />
              Back to athletes
            </Link>

            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-noa-muted">Athlete Profile</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">{athlete.name}</h1>
            <p className="mt-3 text-sm leading-6 text-noa-muted">
              {athlete.category} · {athlete.focus} · Adaptive performance monitoring
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="metric-card">
                <p className="text-sm text-noa-muted">CTL</p>
                <p className="mt-3 text-4xl font-bold text-white">{athlete.ctl}</p>
              </div>

              <div className="metric-card">
                <p className="text-sm text-noa-muted">ATL</p>
                <p className="mt-3 text-4xl font-bold text-white">{athlete.atl}</p>
              </div>

              <div className="metric-card">
                <p className="text-sm text-noa-muted">TSB</p>
                <p className="mt-3 text-4xl font-bold text-white">{athlete.tsb}</p>
              </div>

              <div className="metric-card">
                <p className="text-sm text-noa-muted">HRV</p>
                <p className="mt-3 text-4xl font-bold text-white">{athlete.hrv}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/5 bg-gradient-to-br from-noa-panel2 to-noa-bg p-5">
            <p className="text-sm font-medium text-white">Readiness</p>

            <div className="mt-8 flex items-end gap-3">
              <div className="text-6xl font-bold tracking-tight text-white">{athlete.readiness}</div>
              <div className="pb-2 text-sm text-noa-muted">/ 100</div>
            </div>

            <p className="mt-4 text-sm leading-6 text-noa-muted">
              Current athlete status based on load, HRV trend and execution consistency.
            </p>

            <div className="mt-6 rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-noa-muted">Global risk</span>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    athlete.risk === "Alert"
                      ? "bg-noa-danger/15 text-noa-danger"
                      : athlete.risk === "Controlled"
                        ? "bg-noa-warning/15 text-noa-warning"
                        : "bg-noa-success/15 text-noa-success",
                  ].join(" ")}
                >
                  {athlete.risk}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="panel p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-accent">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Load & Performance Trend</p>
              <p className="text-sm text-noa-muted">CTL / ATL / TSB analysis area</p>
            </div>
          </div>

          <div className="mt-6 flex h-[340px] items-center justify-center rounded-[28px] border border-dashed border-noa-line bg-noa-panel2 text-noa-muted">
            Athlete performance chart area
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-success">
                <HeartPulse size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Recovery Snapshot</p>
                <p className="text-sm text-noa-muted">Biomarkers and recovery state</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">HRV</span>
                <span className="text-sm font-semibold text-white">{athlete.hrv}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">Resting HR</span>
                <span className="text-sm font-semibold text-white">{athlete.restingHr}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">Acute fatigue</span>
                <span className="text-sm font-semibold text-white">{athlete.fatigue}</span>
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-warning">
                <ShieldAlert size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Risk Engine</p>
                <p className="text-sm text-noa-muted">Current risk state</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-noa-muted">Overall</span>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    athlete.risk === "Alert"
                      ? "bg-noa-danger/15 text-noa-danger"
                      : athlete.risk === "Controlled"
                        ? "bg-noa-warning/15 text-noa-warning"
                        : "bg-noa-success/15 text-noa-success",
                  ].join(" ")}
                >
                  {athlete.risk}
                </span>
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-blue">
                <CalendarRange size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Planning Status</p>
                <p className="text-sm text-noa-muted">Adaptive plan readiness</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <p className="text-sm text-noa-muted">Next recommendation</p>
              <p className="mt-2 text-sm font-medium text-white">
                Maintain controlled load progression and monitor recovery response in next 48h.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="panel p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-accent">
              <TimerReset size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Execution Quality</p>
              <p className="text-sm text-noa-muted">Plan vs execution</p>
            </div>
          </div>

          <div className="mt-6 flex h-40 items-center justify-center rounded-[28px] border border-dashed border-noa-line bg-noa-panel2 text-noa-muted">
            Execution analysis
          </div>
        </div>

        <div className="panel p-6 xl:col-span-2">
          <p className="text-lg font-semibold text-white">Recent Sessions</p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <span className="text-sm text-white">Bike threshold intervals</span>
              <span className="text-sm text-noa-muted">TSS 118</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <span className="text-sm text-white">Aerobic run</span>
              <span className="text-sm text-noa-muted">TSS 64</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <span className="text-sm text-white">Recovery swim</span>
              <span className="text-sm text-noa-muted">TSS 32</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
