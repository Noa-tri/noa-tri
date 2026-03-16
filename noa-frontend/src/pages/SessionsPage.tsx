const sessions = [
  {
    athlete: "Lucía Fernández",
    type: "Bike",
    date: "2026-03-15",
    duration: "01:42:18",
    tss: 118,
    avgHr: 149,
    status: "Processed",
  },
  {
    athlete: "Tomás Rivas",
    type: "Run",
    date: "2026-03-15",
    duration: "00:58:11",
    tss: 74,
    avgHr: 156,
    status: "Processed",
  },
  {
    athlete: "Valentina Costa",
    type: "Swim",
    date: "2026-03-14",
    duration: "00:51:05",
    tss: 49,
    avgHr: 132,
    status: "Processed",
  },
];

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Training Data</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sessions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
          Historial operacional de sesiones ingeridas desde Garmin, listas para análisis, carga,
          riesgo y planificación adaptativa.
        </p>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-noa-line px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Recent sessions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-noa-panel2">
              <tr className="text-left">
                <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Athlete</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Sport</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Date</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Duration</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">TSS</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Avg HR</th>
                <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Status</th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((session, index) => (
                <tr
                  key={`${session.athlete}-${index}`}
                  className="border-t border-noa-line/80 bg-noa-panel/40"
                >
                  <td className="px-6 py-4 text-sm font-medium text-white">{session.athlete}</td>
                  <td className="px-6 py-4 text-sm text-noa-muted">{session.type}</td>
                  <td className="px-6 py-4 text-sm text-noa-muted">{session.date}</td>
                  <td className="px-6 py-4 text-sm text-noa-muted">{session.duration}</td>
                  <td className="px-6 py-4 text-sm text-white">{session.tss}</td>
                  <td className="px-6 py-4 text-sm text-white">{session.avgHr}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-noa-success/15 px-3 py-1 text-xs font-semibold text-noa-success">
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
