import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

import { apiGet, apiPost } from "../lib/api";
import type { Athlete } from "../types/athlete";
import type { NLSSModel } from "../types/nlss";

export default function NLSSPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [selectedSport, setSelectedSport] = useState("bike");
  const [models, setModels] = useState<NLSSModel[]>([]);

  const [loading, setLoading] = useState(true);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);

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

  async function loadModels(athleteId: string, sport: string) {
    if (!athleteId) {
      setModels([]);
      return;
    }

    try {
      setModelsLoading(true);
      setModelsError(null);
      const data = await apiGet<NLSSModel[]>(`/nlss/${athleteId}?sport=${sport}`);
      setModels(data);
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : "Failed to load NLSS models");
    } finally {
      setModelsLoading(false);
    }
  }

  useEffect(() => {
    loadModels(selectedAthleteId, selectedSport);
  }, [selectedAthleteId, selectedSport]);

  async function handleCalibrate() {
    if (!selectedAthleteId) return;

    try {
      setCalibrating(true);
      setCalibrationError(null);

      const created = await apiPost<NLSSModel>(
        `/nlss/calibrate/${selectedAthleteId}?sport=${selectedSport}`,
        {}
      );

      setModels((prev) => [created, ...prev]);
    } catch (error) {
      setCalibrationError(error instanceof Error ? error.message : "Failed to calibrate NLSS");
    } finally {
      setCalibrating(false);
    }
  }

  const selectedAthlete = useMemo(
    () => athletes.find((athlete) => athlete.id === selectedAthleteId) ?? null,
    [athletes, selectedAthleteId]
  );

  const latestModel = models.length > 0 ? models[0] : null;

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Performance Modeling</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">NLSS Models</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
              Parámetros fisiológicos dinámicos por atleta y disciplina.
            </p>
          </div>

          <button
            onClick={handleCalibrate}
            disabled={calibrating || !selectedAthleteId}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-noa-accent to-noa-blue px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            <Sparkles size={16} />
            {calibrating ? "Calibrating..." : "Calibrate NLSS"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

          <div>
            <label className="mb-2 block text-sm font-medium text-white">Sport</label>
            <select
              value={selectedSport}
              onChange={(event) => setSelectedSport(event.target.value)}
              className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
            >
              <option value="bike">Bike</option>
              <option value="run">Run</option>
              <option value="swim">Swim</option>
              <option value="triathlon">Triathlon</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => loadModels(selectedAthleteId, selectedSport)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm font-medium text-white"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {selectedAthlete && (
          <div className="mt-4 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm text-noa-muted">
            Showing NLSS models for{" "}
            <span className="font-semibold text-white">
              {selectedAthlete.first_name} {selectedAthlete.last_name}
            </span>
            {" · "}
            <span className="font-semibold text-white capitalize">{selectedSport}</span>
          </div>
        )}

        {pageError && (
          <div className="mt-4 rounded-2xl border border-noa-danger/30 bg-noa-danger/10 px-4 py-3 text-sm text-noa-danger">
            {pageError}
          </div>
        )}

        {modelsError && (
          <div className="mt-4 rounded-2xl border border-noa-danger/30 bg-noa-danger/10 px-4 py-3 text-sm text-noa-danger">
            {modelsError}
          </div>
        )}

        {calibrationError && (
          <div className="mt-4 rounded-2xl border border-noa-danger/30 bg-noa-danger/10 px-4 py-3 text-sm text-noa-danger">
            {calibrationError}
          </div>
        )}
      </section>

      {latestModel && (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
          <div className="metric-card">
            <p className="text-sm text-noa-muted">K1</p>
            <p className="mt-3 text-4xl font-bold text-white">{latestModel.k1 ?? "--"}</p>
          </div>

          <div className="metric-card">
            <p className="text-sm text-noa-muted">K2</p>
            <p className="mt-3 text-4xl font-bold text-white">{latestModel.k2 ?? "--"}</p>
          </div>

          <div className="metric-card">
            <p className="text-sm text-noa-muted">T1</p>
            <p className="mt-3 text-4xl font-bold text-white">{latestModel.t1 ?? "--"}</p>
          </div>

          <div className="metric-card">
            <p className="text-sm text-noa-muted">T2</p>
            <p className="mt-3 text-4xl font-bold text-white">{latestModel.t2 ?? "--"}</p>
          </div>

          <div className="metric-card">
            <p className="text-sm text-noa-muted">Fit Error</p>
            <p className="mt-3 text-4xl font-bold text-white">{latestModel.fit_error ?? "--"}</p>
          </div>
        </section>
      )}

      <section className="panel overflow-hidden">
        <div className="border-b border-noa-line px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Calibration history</h2>
        </div>

        {modelsLoading ? (
          <div className="p-6 text-sm text-noa-muted">Loading NLSS models...</div>
        ) : models.length === 0 ? (
          <div className="p-6 text-sm text-noa-muted">No NLSS models found for this athlete.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-noa-panel2">
                <tr className="text-left">
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Date</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Sport</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">K1</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">K2</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">T1</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">T2</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Fit Error</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Points</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Window</th>
                </tr>
              </thead>

              <tbody>
                {models.map((model) => (
                  <tr key={model.id} className="border-t border-noa-line/80 bg-noa-panel/40">
                    <td className="px-6 py-4 text-sm text-white">
                      {new Date(model.calibration_date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-white">{model.sport}</td>
                    <td className="px-6 py-4 text-sm text-white">{model.k1 ?? "--"}</td>
                    <td className="px-6 py-4 text-sm text-white">{model.k2 ?? "--"}</td>
                    <td className="px-6 py-4 text-sm text-white">{model.t1 ?? "--"}</td>
                    <td className="px-6 py-4 text-sm text-white">{model.t2 ?? "--"}</td>
                    <td className="px-6 py-4 text-sm text-white">{model.fit_error ?? "--"}</td>
                    <td className="px-6 py-4 text-sm text-white">{model.data_points ?? "--"}</td>
                    <td className="px-6 py-4 text-sm text-white">
                      {model.window_start ?? "--"} → {model.window_end ?? "--"}
                    </td>
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
