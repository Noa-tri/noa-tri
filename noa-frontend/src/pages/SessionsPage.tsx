import { useEffect, useMemo, useState } from "react";

import { apiGet } from "../lib/api";
import type { Athlete } from "../types/athlete";
import type { TrainingSession } from "../types/session";

function formatDuration(durationSec: number | null): string {
  if (!durationSec || durationSec <= 0) {
    return "--";
  }

  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const seconds = durationSec % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatDistance(distanceMeters: number | null): string {
  if (distanceMeters == null) {
    return "--";
  }

  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

export default function SessionsPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [sessions, setSessions] = useState<TrainingSession[]>([]);

  const [athletesLoading, setAthletesLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

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
    async function loadSessions() {
      if (!selectedAthleteId) {
        setSessions([]);
        return;
      }

      try {
        setSessionsLoading(true);
        setSessionsError(null);

        const data = await apiGet<TrainingSession[]>(`/sessions/${selectedAthleteId}`);
        setSessions(data);
      } catch (error) {
        setSessionsError(error instanceof Error ? error.message : "Failed to load sessions");
      } finally {
        setSessionsLoading(false);
      }
    }

    loadSessions();
  }, [selectedAthleteId]);

  const selectedAthlete = useMemo(() => {
    return athletes.find((athlete) => athlete.id === selectedAthleteId) ?? null;
  }, [athletes, selectedAthleteId]);

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Training Data</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sessions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
          Historial real de sesiones por atleta, consumido desde el backend de NOA TRI.
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
                setSessionsLoading(true);
                setSessionsError(null);
                const data = await apiGet<TrainingSession[]>(`/sessions/${selectedAthleteId}`);
                setSessions(data);
              } catch (error) {
                setSessionsError(error instanceof Error ? error.message : "Failed to load sessions");
              } finally {
                setSessionsLoading(false);
              }
            }}
            className="rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm font-medium text-white"
          >
            Refresh
          </button>
        </div>

        {selectedAthlete && (
          <div className="mt-4 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm text-noa-muted">
            Showing sessions for{" "}
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

        {sessionsError && (
          <div className="mt-4 rounded-2xl border border-noa-danger/30 bg-noa-danger/10 px-4 py-3 text-sm text-noa-danger">
            {sessionsError}
          </div>
        )}
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-noa-line px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Sessions list</h2>
        </div>

        {sessionsLoading ? (
          <div className="p-6 text-sm text-noa-muted">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-sm text-noa-muted">
            No sessions found for this athlete.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-noa-panel2">
                <tr className="text-left">
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Sport</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Start time</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Duration</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Distance</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Avg HR</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Max HR</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">Avg Power</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">NP</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">IF</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-[0.2em] text-noa-muted">TSS</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="border-t border-noa-line/80 bg-noa-panel/40"
                  >
                    <td className="px-6 py-4 text-sm font-medium capitalize text-white">
                      {session.sport}
                    </td>
                    <td className="px-6 py-4 text-sm text-noa-muted">
                      {new Date(session.start_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-noa-muted">
                      {formatDuration(session.duration_sec)}
                    </td>
                    <td className="px-6 py-4 text-sm text-noa-muted">
                      {formatDistance(session.distance_m)}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {session.avg_hr ?? "--"}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {session.max_hr ?? "--"}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {session.avg_power_w ?? "--"}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {session.normalized_power_w ?? "--"}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {session.intensity_factor ?? "--"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {session.tss ?? "--"}
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
