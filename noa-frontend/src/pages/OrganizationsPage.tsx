import { useNavigate } from "react-router-dom";

export default function OrganizationsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">NOA TRI</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Organizations</h1>
        <p className="mt-3 text-sm text-slate-400">
          Punto de entrada operativo para navegar organización, atletas y planificación.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <button
          onClick={() => navigate("/athletes")}
          className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-6 text-left transition hover:border-cyan-400/40 hover:bg-[#0b1d34]"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Triathlon
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Organization</span>
          </div>

          <h3 className="mt-6 text-2xl font-semibold text-white">NOA TRI</h3>
          <p className="mt-2 text-sm text-slate-400">
            Acceso directo al flujo operativo completo.
          </p>

          <div className="mt-8 flex items-center justify-between">
            <span className="text-sm text-slate-400">Open athletes</span>
            <span className="text-sm font-medium text-cyan-300">Enter →</span>
          </div>
        </button>
      </div>
    </div>
  );
}
