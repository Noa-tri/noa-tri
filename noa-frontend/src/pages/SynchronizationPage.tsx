import { useState } from "react";

export default function SynchronizationPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("No synchronization executed yet.");

  async function handleSync() {
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/synchronization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider: "garmin" }),
      });

      const text = await response.text();
      setMessage(text || "Synchronization executed.");
    } catch {
      setMessage("Synchronization failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">NOA TRI</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Synchronization</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-400">
          Ejecutá sincronización con Garmin y validá respuesta del backend.
        </p>
      </div>

      <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-8">
        <button
          onClick={handleSync}
          disabled={loading}
          className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Synchronizing..." : "Sync Garmin"}
        </button>

        <div className="mt-6 rounded-2xl border border-white/10 bg-[#06111f] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Result</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{message}</pre>
        </div>
      </div>
    </div>
  );
}
