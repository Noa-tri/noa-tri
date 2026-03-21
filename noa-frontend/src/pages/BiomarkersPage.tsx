import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { getBiomarkers, type Biomarker } from "../lib/api";

export default function BiomarkersPage() {
  const [searchParams] = useSearchParams();
  const athleteId = searchParams.get("athleteId") || "";
  const [items, setItems] = useState<Biomarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getBiomarkers(athleteId || undefined)
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load biomarkers"))
      .finally(() => setLoading(false));
  }, [athleteId]);

  const latest = useMemo(() => items[0], [items]);

  return (
    <PageShell
      title="Metrics"
      subtitle="Monitoreo de readiness, recovery y biomarcadores del atleta."
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="HRV" value={latest?.hrv} suffix="ms" />
        <MetricCard label="Resting HR" value={latest?.resting_hr} suffix="bpm" />
        <MetricCard label="Sleep Score" value={latest?.sleep_score} />
        <MetricCard label="Readiness" value={latest?.readiness} />
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
          Loading metrics...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-red-200">{error}</div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="grid grid-cols-5 border-b border-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <div>Date</div>
            <div>HRV</div>
            <div>Resting HR</div>
            <div>Sleep</div>
            <div>Fatigue</div>
          </div>

          <div className="divide-y divide-white/10">
            {items.length === 0 ? (
              <div className="px-6 py-8 text-slate-300">No biomarker data available.</div>
            ) : (
              items.map((item) => (
                <div key={String(item.id)} className="grid grid-cols-5 px-6 py-5 text-sm text-slate-200">
                  <div>{item.date || "-"}</div>
                  <div>{item.hrv ?? "-"}</div>
                  <div>{item.resting_hr ?? "-"}</div>
                  <div>{item.sleep_score ?? "-"}</div>
                  <div>{item.fatigue ?? "-"}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function MetricCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value?: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">
        {value ?? "--"} {suffix || ""}
      </p>
    </div>
  );
}
