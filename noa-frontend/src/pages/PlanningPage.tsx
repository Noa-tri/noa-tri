import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { getTrainingPlans, type TrainingPlan } from "../lib/api";

export default function PlanningPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const athleteId = searchParams.get("athleteId") || "";
  const [items, setItems] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getTrainingPlans(athleteId || undefined)
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load training plans"))
      .finally(() => setLoading(false));
  }, [athleteId]);

  return (
    <PageShell
      title="Planning"
      subtitle="Vista operacional del plan del atleta. Desde acá seguís a sesiones ejecutadas."
      actions={
        <button
          onClick={() => navigate(`/sessions?athleteId=${athleteId}`)}
          className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
        >
          Go to Sessions
        </button>
      }
    >
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
          Loading planning...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-red-200">{error}</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
              No planning records available.
            </div>
          ) : (
            items.map((plan) => (
              <div
                key={String(plan.id)}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-300">
                    {plan.status || "planned"}
                  </span>
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    {plan.week_label || "Current microcycle"}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-semibold text-white">{plan.title || "Training block"}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {plan.objective || "Adaptive workload design based on readiness, load and performance evolution."}
                </p>

                <div className="mt-6">
                  <button
                    onClick={() => navigate(`/sessions?athleteId=${athleteId}`)}
                    className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15"
                  >
                    Open Sessions
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </PageShell>
  );
}
