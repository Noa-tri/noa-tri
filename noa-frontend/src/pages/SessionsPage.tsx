import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { getSessions, type Session } from "../lib/api";

export default function SessionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const athleteId = searchParams.get("athleteId") || "";
  const [items, setItems] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getSessions(athleteId || undefined)
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load sessions"))
      .finally(() => setLoading(false));
  }, [athleteId]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.duration += Number(item.duration || 0);
        acc.load += Number(item.load || 0);
        return acc;
      },
      { duration: 0, load: 0 }
    );
  }, [items]);

  return (
    <PageShell
      title="Sessions"
      subtitle="Sesiones ejecutadas y carga acumulada. El siguiente paso operativo son las métricas."
      actions={
        <button
          onClick={() => navigate(`/biomarkers?athleteId=${athleteId}`)}
          className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
        >
          Go to Metrics
        </button>
      }
    >
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Total sessions</p>
          <p className="mt-3 text-3xl font-semibold text-white">{items.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Total duration</p>
          <p className="mt-3 text-3xl font-semibold text-white">{totals.duration} min</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Accumulated load</p>
          <p className="mt-3 text-3xl font-semibold text-white">{totals.load}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
          Loading sessions...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-red-200">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="grid grid-cols-5 border-b border-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <div>Date</div>
            <div>Title</div>
            <div>Type</div>
            <div>Duration</div>
            <div>Load</div>
          </div>

          <div className="divide-y divide-white/10">
            {items.length === 0 ? (
              <div className="px-6 py-8 text-slate-300">No sessions available.</div>
            ) : (
              items.map((session) => (
                <div key={String(session.id)} className="grid grid-cols-5 px-6 py-5 text-sm text-slate-200">
                  <div>{session.date || "-"}</div>
                  <div>{session.title || `Session ${session.id}`}</div>
                  <div>{session.type || "-"}</div>
                  <div>{session.duration || 0} min</div>
                  <div>{session.load || 0}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
