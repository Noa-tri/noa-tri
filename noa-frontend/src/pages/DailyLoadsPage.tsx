import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { apiGet } from "../lib/api";
import type { Athlete } from "../types/athlete";
import type { DailyLoad } from "../types/daily-load";

export default function DailyLoadsPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [dailyLoads, setDailyLoads] = useState<DailyLoad[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadsLoading, setLoadsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadsError, setLoadsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAthletes() {
      try {
        setLoading(true);
        setPageError(null);
        const data = await apiGet<Athlete[]>("/athletes/");
        setAthletes(data);
        if (data.length > 0) {
          setSelectedAthleteId(data[0].id);
        }
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Failed to load athletes");
      } finally {
        setLoading(false);
      }
    }

    loadAthletes();
  }, []);

  async function loadDailyLoads(athleteId: string) {
    if (!athleteId) {
      setDailyLoads([]);
      return;
    }

    try {
      setLoadsLoading(true);
      setLoadsError(null);
      const data = await apiGet<DailyLoad[]>(`/daily-loads/${athleteId}`);
      setDailyLoads(data);
    } catch (error) {
      setLoadsError(error instanceof Error ? error.message : "Failed to load daily loads");
    } finally {
      setLoadsLoading(false);
    }
  }

  useEffect(() => {
    loadDailyLoads(selectedAthleteId);
  }, [selectedAthleteId]);

  const selectedAthlete = useMemo(
    () => athletes.find((athlete) => athlete.id === selectedAthleteId) ?? null,
    [athletes, selectedAthleteId]
  );

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Performance Modeling</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Daily Loads</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
          Carga diaria agregada por atleta y disciplina, base del modelo NLSS.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Athlete</label>
            <select
              value={selectedAthleteId}
              onChange={(event) => setSelectedAthleteId(event.target.value)}
              disabled={loading || athletes.length === 0}
              className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
            >
              {athletes.length === 0 ? (
                <option value="">No athletes available</option>
              ) : (
                athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.first_name} {athlete.last_name}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={() => loadDailyLoads(selectedAthleteId)}
            className="inline-flex items-center gap-2 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm font-medium text-white"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {selectedAthlete && (
          <div className="mt-4 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm text-noa-muted">
            Showing daily loads for{" "}
            <span className="font-semibold text-white">
              {selectedAthlete.first_name} {selectedAthlete.last_name}
            </span>
          </div>
        )}

        {pageError && (
          <div className="mt-4 rounded-2xl border border-noa-danger/30 bg-noa-danger/10 px-4 py-3 text-sm text-noa-danger">
            {pageError}
          </div>
        )}

        {loadsError && (
          <div className="mt-4 rounded-2xl border border-noa-danger/30 bg-noa-danger/10 px-4 py-3 text-sm text-noa-danger">
            {loadsError}
          </div>
        )}
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-noa-line px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Daily load rows</h2>
        </div>

        {loadsLoading ? (
          <div className="p-6 text-sm text-noa-muted">Loading daily loads...</div>
        ) : dailyLoads.length === 0 ? (
          <div className="p-6 text-sm text-noa-muted">No daily loads found for this athlete.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-noa-panel2">
                <tr className="text-left">
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Day</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Sport</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">TSS</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">rTSS</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">sTSS</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Total Load</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Sources</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Quality</th>
                </tr>
              </thead>

              <tbody>
                {dailyLoads.map((row) => (
                  <tr key={row.id} className="border-t border-noa-line/80 bg-noa-panel/40">
                    <td className="px-6 py-4 text-sm text-white">{row.day}</td>
                    <td className="px-6 py-4 text-sm capitalize text-white">{row.sport}</td>
                    <td className="px-6 py-4 text-sm text-white">{row.tss ?? "--"}</td>
                    <td className="px-6 py-4 text-sm text-white">{row.rtss ?? "--"}</td>
                    <td className="px-6 py-4 text-sm text-white">{row.stss ?? "--"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">{row.total_load ?? "--"}</td>
                    <td className="px-6 py-4 text-sm text-white">{row.source_count}</td>
                    <td className="px-6 py-4 text-sm text-white">{row.data_quality_score ?? "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
