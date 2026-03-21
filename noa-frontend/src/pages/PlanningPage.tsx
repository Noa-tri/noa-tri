import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import { getTrainingPlans, type TrainingPlan } from "../lib/api";

export default function PlanningPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const athleteId = searchParams.get("athleteId") || "";
  const [items, setItems] = useState<TrainingPlan[]>([]);

  useEffect(() => {
    getTrainingPlans(athleteId || undefined).then(setItems).catch(() => setItems([]));
  }, [athleteId]);

  return (
    <>
      <PageHeader
        title="Planning"
        subtitle="Planificación del atleta y acceso inmediato a sesiones."
        actions={
          athleteId ? (
            <button
              onClick={() => navigate(`/sessions?athleteId=${athleteId}`)}
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Open Sessions
            </button>
          ) : null
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
            No training plans available.
          </div>
        ) : (
          items.map((plan) => (
            <div
              key={String(plan.id)}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                {plan.week_label || "Current block"}
              </p>
              <h3 className="mt-3 text-xl font-semibold">{plan.title || "Training Plan"}</h3>
              <p className="mt-3 text-sm text-slate-300">
                {plan.objective || "Adaptive plan based on athlete state and workload."}
              </p>
              <p className="mt-4 text-sm text-slate-400">{plan.status || "planned"}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
