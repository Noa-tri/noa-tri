const risks = [
  {
    athlete: "Lucía Fernández",
    fatigue: "Moderate",
    hrvTrend: "Stable",
    execution: "Aligned",
    overall: "Controlled",
  },
  {
    athlete: "Tomás Rivas",
    fatigue: "High",
    hrvTrend: "Suppressed",
    execution: "Mismatch",
    overall: "Alert",
  },
  {
    athlete: "Valentina Costa",
    fatigue: "Low",
    hrvTrend: "Strong",
    execution: "Aligned",
    overall: "Optimal",
  },
];

export default function RiskPage() {
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Risk Engine</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Risk</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
          Visión consolidada de riesgo fisiológico, fatiga aguda, deriva de recuperación y desvíos
          entre carga esperada y carga ejecutada.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {risks.map((risk) => (
          <div key={risk.athlete} className="panel p-5">
            <p className="text-lg font-semibold text-white">{risk.athlete}</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">Acute fatigue</span>
                <span className="text-sm font-semibold text-white">{risk.fatigue}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">HRV trend</span>
                <span className="text-sm font-semibold text-white">{risk.hrvTrend}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">Execution quality</span>
                <span className="text-sm font-semibold text-white">{risk.execution}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">Overall state</span>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    risk.overall === "Alert"
                      ? "bg-noa-danger/15 text-noa-danger"
                      : risk.overall === "Controlled"
                        ? "bg-noa-warning/15 text-noa-warning"
                        : "bg-noa-success/15 text-noa-success",
                  ].join(" ")}
                >
                  {risk.overall}
                </span>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
