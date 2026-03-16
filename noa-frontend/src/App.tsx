export default function App() {
  return (
    <div className="min-h-screen bg-noa-bg text-noa-text">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-noa-line bg-noa-panel p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-wide text-white">NOA TRI</h1>
            <p className="mt-1 text-sm text-noa-muted">Performance Intelligence</p>
          </div>

          <nav className="space-y-2">
            <button className="w-full rounded-xl bg-noa-soft px-4 py-3 text-left text-sm font-medium text-white">
              Dashboard
            </button>
            <button className="w-full rounded-xl px-4 py-3 text-left text-sm text-noa-muted hover:bg-noa-soft hover:text-white">
              Athletes
            </button>
            <button className="w-full rounded-xl px-4 py-3 text-left text-sm text-noa-muted hover:bg-noa-soft hover:text-white">
              Sessions
            </button>
            <button className="w-full rounded-xl px-4 py-3 text-left text-sm text-noa-muted hover:bg-noa-soft hover:text-white">
              Biomarkers
            </button>
            <button className="w-full rounded-xl px-4 py-3 text-left text-sm text-noa-muted hover:bg-noa-soft hover:text-white">
              Planning
            </button>
            <button className="w-full rounded-xl px-4 py-3 text-left text-sm text-noa-muted hover:bg-noa-soft hover:text-white">
              Risk
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">Dashboard</h2>
              <p className="mt-1 text-sm text-noa-muted">
                Plataforma de análisis y coaching para triatlón
              </p>
            </div>

            <div className="rounded-2xl border border-noa-line bg-noa-panel px-4 py-3 text-sm text-noa-muted">
              Backend API: <span className="font-semibold text-white">http://localhost:8000</span>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-noa-line bg-noa-panel p-5">
              <p className="text-sm text-noa-muted">CTL</p>
              <p className="mt-3 text-3xl font-bold text-white">--</p>
            </div>

            <div className="rounded-2xl border border-noa-line bg-noa-panel p-5">
              <p className="text-sm text-noa-muted">ATL</p>
              <p className="mt-3 text-3xl font-bold text-white">--</p>
            </div>

            <div className="rounded-2xl border border-noa-line bg-noa-panel p-5">
              <p className="text-sm text-noa-muted">TSB</p>
              <p className="mt-3 text-3xl font-bold text-white">--</p>
            </div>

            <div className="rounded-2xl border border-noa-line bg-noa-panel p-5">
              <p className="text-sm text-noa-muted">HRV</p>
              <p className="mt-3 text-3xl font-bold text-white">--</p>
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-noa-line bg-noa-panel p-6 xl:col-span-2">
              <h3 className="text-lg font-semibold text-white">Performance Overview</h3>
              <div className="mt-6 flex h-72 items-center justify-center rounded-2xl border border-dashed border-noa-line bg-noa-soft/40 text-noa-muted">
                Acá vamos a conectar CTL / ATL / TSB / carga / ejecución
              </div>
            </div>

            <div className="rounded-2xl border border-noa-line bg-noa-panel p-6">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>

              <div className="mt-6 space-y-3">
                <button className="w-full rounded-xl bg-noa-accent px-4 py-3 font-semibold text-slate-900">
                  Sync Garmin
                </button>
                <button className="w-full rounded-xl bg-noa-soft px-4 py-3 font-medium text-white">
                  Ver atletas
                </button>
                <button className="w-full rounded-xl bg-noa-soft px-4 py-3 font-medium text-white">
                  Ver sesiones
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
