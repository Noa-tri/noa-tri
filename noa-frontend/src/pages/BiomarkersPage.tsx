const biomarkers = [
  {
    athlete: "Lucía Fernández",
    rmssd: 62,
    lnrmssd: 4.13,
    restingHr: 47,
    sleep: 86,
    bodyBattery: 74,
  },
  {
    athlete: "Tomás Rivas",
    rmssd: 49,
    lnrmssd: 3.89,
    restingHr: 54,
    sleep: 71,
    bodyBattery: 58,
  },
  {
    athlete: "Valentina Costa",
    rmssd: 68,
    lnrmssd: 4.22,
    restingHr: 45,
    sleep: 91,
    bodyBattery: 81,
  },
];

export default function BiomarkersPage() {
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Recovery Intelligence</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Biomarkers</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
          Seguimiento de HRV, resting HR y variables complementarias para comprender la respuesta
          fisiológica del atleta y ajustar el entrenamiento.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {biomarkers.map((item) => (
          <div key={item.athlete} className="panel p-5">
            <p className="text-lg font-semibold text-white">{item.athlete}</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">RMSSD</span>
                <span className="text-base font-semibold text-white">{item.rmssd}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">lnRMSSD</span>
                <span className="text-base font-semibold text-white">{item.lnrmssd}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">Resting HR</span>
                <span className="text-base font-semibold text-white">{item.restingHr}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">Sleep score</span>
                <span className="text-base font-semibold text-white">{item.sleep}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">Body battery</span>
                <span className="text-base font-semibold text-white">{item.bodyBattery}</span>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
