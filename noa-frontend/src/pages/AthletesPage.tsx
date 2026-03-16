import { ArrowUpRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

const athletes = [
  {
    id: "lucia-fernandez",
    name: "Lucía Fernández",
    level: "Elite",
    sport: "Triathlon",
    ctl: 84,
    atl: 92,
    tsb: -8,
    hrv: 64,
    status: "Ready",
  },
  {
    id: "tomas-rivas",
    name: "Tomás Rivas",
    level: "Competitive",
    sport: "Ironman",
    ctl: 71,
    atl: 88,
    tsb: -17,
    hrv: 52,
    status: "Fatigue",
  },
  {
    id: "valentina-costa",
    name: "Valentina Costa",
    level: "Elite",
    sport: "Olympic Distance",
    ctl: 79,
    atl: 81,
    tsb: -2,
    hrv: 68,
    status: "Stable",
  },
];

export default function AthletesPage() {
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Athlete Management</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Athletes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
              Visualizá el estado global de carga, recuperación y preparación de tus atletas desde
              una sola vista operativa.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm font-medium text-white">
              <SlidersHorizontal size={16} />
              Filters
            </button>

            <button className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-noa-accent to-noa-blue px-4 py-3 text-sm font-semibold text-slate-950">
              <Plus size={16} />
              New athlete
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3">
          <Search size={16} className="text-noa-muted" />
          <input
            className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-noa-muted"
            placeholder="Search athlete, category, race focus..."
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {athletes.map((athlete) => (
          <div key={athlete.id} className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">{athlete.name}</p>
                <p className="mt-1 text-sm text-noa-muted">
                  {athlete.level} · {athlete.sport}
                </p>
              </div>

              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  athlete.status === "Ready"
                    ? "bg-noa-success/15 text-noa-success"
                    : athlete.status === "Fatigue"
                      ? "bg-noa-warning/15 text-noa-warning"
                      : "bg-noa-blue/15 text-noa-blue",
                ].join(" ")}
              >
                {athlete.status}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">CTL</p>
                <p className="mt-2 text-2xl font-bold text-white">{athlete.ctl}</p>
              </div>

              <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">ATL</p>
                <p className="mt-2 text-2xl font-bold text-white">{athlete.atl}</p>
              </div>

              <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">TSB</p>
                <p className="mt-2 text-2xl font-bold text-white">{athlete.tsb}</p>
              </div>

              <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">HRV</p>
                <p className="mt-2 text-2xl font-bold text-white">{athlete.hrv}</p>
              </div>
            </div>

            <Link
              to={`/athletes/${athlete.id}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-noa-accent"
            >
              Open profile
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
