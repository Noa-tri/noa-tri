import { useEffect, useMemo, useState } from "react";

import { apiGet } from "../lib/api";
import type { Athlete } from "../types/athlete";
import type { Biomarker } from "../types/biomarker";

export default function BiomarkersPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);

  const [athletesLoading, setAthletesLoading] = useState(true);
  const [biomarkersLoading, setBiomarkersLoading] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);
  const [biomarkersError, setBiomarkersError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAthletes() {
      try {
        setAthletesLoading(true);
        setPageError(null);

        const data = await apiGet<Athlete[]>("/athletes/");
        setAthletes(data);

        if (data.length > 0) {
          setSelectedAthleteId(data[0].id);
        }
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Failed to load athletes");
      } finally {
        setAthletesLoading(false);
      }
    }

    loadAthletes();
  }, []);

  useEffect(() => {
    async function loadBiomarkers() {
      if (!selectedAthleteId) {
        setBiomarkers([]);
        return;
      }

      try {
        setBiomarkersLoading(true);
        setBiomarkersError(null);

        const data = await apiGet<Biomarker[]>(`/biomarkers/${selectedAthleteId}`);
        setBiomarkers(data);
      } catch (error) {
        setBiomarkersError(error instanceof Error ? error.message : "Failed to load biomarkers");
      } finally {
        setBiomarkersLoading(false);
      }
    }

    loadBiomarkers();
  }, [selectedAthleteId]);

  const selectedAthlete = useMemo(() => {
    return athletes.find((athlete) => athlete.id === selectedAthleteId) ?? null;
  }, [athletes, selectedAthleteId]);

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Recovery Intelligence</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Biomarkers</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
          Biomarcadores reales por atleta, conectados al backend de NOA TRI.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Athlete</label>
            <select
              value={selectedAthleteId}
              onChange={(event) => setSelectedAthleteId(event.target.value)}
              disabled={athletesLoading || athletes.length === 0}
              className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none disabled:opacity-60"
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
            onClick={async () => {
              if (!selectedAthleteId) {
                return;
              }

              try {
                setBiomarkersLoading(true);
                setBiomarkersError(null);
                const data = await apiGet<Biomarker[]>(`/biomarkers/${selectedAthleteId}`);
                setBiomarkers(data);
              } catch (error) {
                setBiomarkersError(error instanceof Error ? error.message : "Failed to load biomarkers");
              } finally {
                setBiomarkersLoading(false);
              }
            }}
            className="rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm font-medium text-white"
          >
            Refresh
          </button>
        </div>

        {selectedAthlete && (
          <div className="mt-4 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm text-noa-muted">
            Showing biomarkers for{" "}
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

        {biomarkersError && (
          <div className="mt-4 rounded-2xl border border-noa-danger/30 bg-noa-danger/10 px-4 py-3 text-sm text-noa-danger">
            {biomarkersError}
          </div>
        )}
      </section>

      {biomarkersLoading ? (
        <section className="panel p-6 text-sm text-noa-muted">
          Loading biomarkers...
        </section>
      ) : biomarkers.length === 0 ? (
        <section className="panel p-6 text-sm text-noa-muted">
          No biomarkers found for this athlete.
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-3">
          {biomarkers.map((item) => (
            <div key={`${item.athlete_id}-${item.day}`} className="panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-white">{item.day}</p>
                <span className="rounded-full bg-noa-blue/15 px-3 py-1 text-xs font-semibold text-noa-blue">
                  Daily
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                  <span className="text-sm text-noa-muted">RMSSD</span>
                  <span className="text-base font-semibold text-white">
                    {item.hrv_rmssd_ms ?? "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                  <span className="text-sm text-noa-muted">lnRMSSD</span>
                  <span className="text-base font-semibold text-white">
                    {item.hrv_lnrmssd ?? "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                  <span className="text-sm text-noa-muted">Resting HR</span>
                  <span className="text-base font-semibold text-white">
                    {item.resting_hr ?? "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                  <span className="text-sm text-noa-muted">Sleep score</span>
                  <span className="text-base font-semibold text-white">
                    {item.sleep_score ?? "--"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                  <span className="text-sm text-noa-muted">Body battery</span>
                  <span className="text-base font-semibold text-white">
                    {item.body_battery ?? "--"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
