const weekPlan = [
  { day: "Monday", session: "Recovery swim + mobility", load: "Low" },
  { day: "Tuesday", session: "Bike threshold intervals", load: "High" },
  { day: "Wednesday", session: "Aerobic run + strength", load: "Medium" },
  { day: "Thursday", session: "VO2 bike set", load: "High" },
  { day: "Friday", session: "Easy swim + HRV check", load: "Low" },
  { day: "Saturday", session: "Long brick", load: "High" },
  { day: "Sunday", session: "Long endurance run", load: "Medium" },
];

export default function PlanningPage() {
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Adaptive Planning</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Planning</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
          Generación de semana, planificación adaptativa y ajuste entre intención programada y
          ejecución real.
        </p>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-noa-line px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Current week plan</h2>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          {weekPlan.map((item) => (
            <div key={item.day} className="rounded-3xl border border-noa-line bg-noa-panel2 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-noa-muted">{item.day}</p>
              <p className="mt-3 text-lg font-semibold text-white">{item.session}</p>
              <span
                className={[
                  "mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  item.load === "High"
                    ? "bg-noa-warning/15 text-noa-warning"
                    : item.load === "Medium"
                      ? "bg-noa-blue/15 text-noa-blue"
                      : "bg-noa-success/15 text-noa-success",
                ].join(" ")}
              >
                {item.load}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
