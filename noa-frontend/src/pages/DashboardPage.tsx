import { useEffect, useState } from "react";
import PageHeader from "../components/layout/PageHeader";
import { getDashboard } from "../lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<any>({
    total_athletes: 0,
    total_sessions: 0,
    avg_readiness: 0,
    sync_status: "unknown",
  });

  useEffect(() => {
    getDashboard().then(setData).catch(() => null);
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Vista operacional general del sistema."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card label="Athletes" value={data.total_athletes ?? 0} />
        <Card label="Sessions" value={data.total_sessions ?? 0} />
        <Card label="Avg Readiness" value={data.avg_readiness ?? 0} />
        <Card label="Sync Status" value={data.sync_status ?? "unknown"} />
      </div>
    </>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
