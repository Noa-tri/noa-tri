import { useState } from "react";
import PageHeader from "../components/layout/PageHeader";
import { synchronizeGarmin } from "../lib/api";

export default function SynchronizationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("No synchronization executed yet.");

  async function onSync() {
    setLoading(true);
    try {
      const response = await synchronizeGarmin({ provider: "garmin" });
      setResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      setResult(error?.message || "Synchronization failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Synchronization"
        subtitle="Sincronización operativa con Garmin y servicios de ingestión."
        actions={
          <button
            onClick={onSync}
            disabled={loading}
            className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            {loading ? "Synchronizing..." : "Sync Garmin"}
          </button>
        }
      />

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-slate-400">Result</p>
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm text-slate-200">
          {result}
        </pre>
      </div>
    </>
  );
}
