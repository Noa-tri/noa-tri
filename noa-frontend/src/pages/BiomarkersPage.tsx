import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import { getBiomarkers, type Biomarker } from "../lib/api";

export default function BiomarkersPage() {
  const [searchParams] = useSearchParams();
  const athleteId = searchParams.get("athleteId") || "";
  const [items, setItems] = useState<Biomarker[]>([]);

  useEffect(() => {
    getBiomarkers(athleteId || undefined).then(setItems).catch(() => setItems([]));
  }, [athleteId]);

  const latest = useMemo(() => items[0], [items]);

  return (
    <>
      <PageHeader
        title="Metrics"
        subtitle="Readiness, recovery y biomarcadores del atleta."
      />

      <div className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card label="HRV" value={latest?.hrv ?? "--"} />
        <Card label="Resting HR" value={latest?.resting_hr ?? "--"} />
        <Card label="Sleep Score" value={latest?.sleep_score ?? "--"} />
        <Card label="Readiness" value={latest?.readiness ?? "--"} />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-5 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-slate-400">
          <div>Date</div>
          <div>HRV</div>
          <div>Resting HR</div>
          <div>Sleep</div>
          <div>Fatigue</div>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-8 text-slate-300">No biomarker data available.</div>
        ) : (
          items.map((item) => (
            <div
              key={String(item.id)}
              className="grid grid-cols-5 border-b border-white/10 px-6 py-5 text-sm"
            >
              <div>{item.date || "-"}</div>
              <div>{item.hrv ?? "-"}</div>
              <div>{item.resting_hr ?? "-"}</div>
              <div>{item.sleep_score ?? "-"}</div>
              <div>{item.fatigue ?? "-"}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}
