import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { getAthletes, type Athlete } from "../lib/api";

function athleteName(a: Athlete) {
  return a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || `Athlete ${a.id}`;
}

export default function AthletesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get("organizationId") || "";
  const [items, setItems] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    getAthletes(organizationId || undefined)
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load athletes"))
      .finally(() => setLoading(false));
  }, [organizationId]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter((a) => athleteName(a).toLowerCase().includes(q));
  }, [items, query]);

  return (
    <PageShell
      title="Athletes"
      subtitle="Seleccioná un atleta para entrar a planificación, sesiones y métricas."
      actions={
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search athlete..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 md:w-80"
        />
      }
    >
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
          Loading athletes...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-red-200">{error}</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((athlete) => (
            <button
              key={String(athlete.id)}
              onClick={() => navigate(`/planning?athleteId=${athlete.id}`)}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{athleteName(athlete)}</h3>
                  <p className="mt-2 text-sm text-slate-300">{athlete.sport || "Triathlon"}</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  {athlete.status || "active"}
                </span>
              </div>

              <div className="mt-8 flex items-center justify-between text-sm text-slate-400">
                <span>ID {athlete.id}</span>
                <span className="text-cyan-300">Planning →</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  );
}
