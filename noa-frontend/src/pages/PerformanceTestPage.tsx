import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";

import { apiGet, apiPost } from "../lib/api";
import type { Athlete } from "../types/athlete";
import type { PerformanceTest, PerformanceTestCreatePayload } from "../types/performance-test";

type FormState = {
  athlete_id: string;
  sport: string;
  test_type: string;
  metric_name: string;
  metric_value: string;
  duration_sec: string;
  distance_m: string;
  performed_at: string;
  source: string;
  validated: boolean;
  notes: string;
};

const initialFormState: FormState = {
  athlete_id: "",
  sport: "bike",
  test_type: "ftp_20m",
  metric_name: "power_w",
  metric_value: "",
  duration_sec: "",
  distance_m: "",
  performed_at: "",
  source: "coach",
  validated: false,
  notes: "",
};

function toNullableNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function PerformanceTestsPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [tests, setTests] = useState<PerformanceTest[]>([]);

  const [loading, setLoading] = useState(true);
  const [testsLoading, setTestsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [testsError, setTestsError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  async function loadTests(athleteId: string) {
    if (!athleteId) {
      setTests([]);
      return;
    }

    try {
      setTestsLoading(true);
      setTestsError(null);
      const data = await apiGet<PerformanceTest[]>(`/performance-tests/${athleteId}`);
      setTests(data);
    } catch (error) {
      setTestsError(error instanceof Error ? error.message : "Failed to load performance tests");
    } finally {
      setTestsLoading(false);
    }
  }

  useEffect(() => {
    loadTests(selectedAthleteId);
  }, [selectedAthleteId]);

  const selectedAthlete = useMemo(
    () => athletes.find((athlete) => athlete.id === selectedAthleteId) ?? null,
    [athletes, selectedAthleteId]
  );

  function handleOpenCreate() {
    setCreateError(null);
    setFormState({
      ...initialFormState,
      athlete_id: selectedAthleteId,
      performed_at: new Date().toISOString().slice(0, 16),
    });
    setIsCreateOpen(true);
  }

  async function handleCreateTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreateLoading(true);
    setCreateError(null);

    const payload: PerformanceTestCreatePayload = {
      athlete_id: formState.athlete_id,
      sport: formState.sport,
      test_type: formState.test_type,
      metric_name: formState.metric_name,
      metric_value: Number(formState.metric_value),
      duration_sec: toNullableNumber(formState.duration_sec),
      distance_m: toNullableNumber(formState.distance_m),
      performed_at: new Date(formState.performed_at).toISOString(),
      source: formState.source,
      validated: formState.validated,
      notes: formState.notes.trim() || null,
    };

    try {
      const created = await apiPost<PerformanceTest>("/performance-tests/", payload);
      setTests((prev) => [created, ...prev]);
      setFormState(initialFormState);
      setIsCreateOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create performance test");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Performance Modeling</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Performance Tests</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
              Tests y resultados usados como referencia real para calibrar el modelo fisiológico.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-noa-accent to-noa-blue px-4 py-3 text-sm font-semibold text-slate-950"
          >
            <Plus size={16} />
            New test
          </button>
        </div>

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
            onClick={() => loadTests(selectedAthleteId)}
            className="inline-flex items-center gap-2 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm font-medium text-white"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {selectedAthlete && (
          <div className="mt-4 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm text-noa-muted">
            Showing tests for{" "}
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

        {testsError && (
          <div className="mt-4 rounded-2xl border border-noa-danger/30 bg-noa-danger/10 px-4 py-3 text-sm text-noa-danger">
            {testsError}
          </div>
        )}
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-noa-line px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Registered tests</h2>
        </div>

        {testsLoading ? (
          <div className="p-6 text-sm text-noa-muted">Loading tests...</div>
        ) : tests.length === 0 ? (
          <div className="p-6 text-sm text-noa-muted">No tests found for this athlete.</div>
        ) : (
          <div className="grid gap-4 p-6 xl:grid-cols-2">
            {tests.map((test) => (
              <div key={test.id} className="rounded-3xl border border-noa-line bg-noa-panel2 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase text-white">{test.test_type}</p>
                    <p className="mt-1 text-xs text-noa-muted">{new Date(test.performed_at).toLocaleString()}</p>
                  </div>

                  <span className="rounded-full bg-noa-blue/15 px-3 py-1 text-xs font-semibold text-noa-blue">
                    {test.sport}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-noa-line bg-noa-bg/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">{test.metric_name}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{test.metric_value}</p>
                  </div>

                  <div className="rounded-2xl border border-noa-line bg-noa-bg/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Validated</p>
                    <p className="mt-2 text-lg font-semibold text-white">{test.validated ? "Yes" : "No"}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-noa-bg/40 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Duration</p>
                    <p className="mt-2 text-sm font-semibold text-white">{test.duration_sec ?? "--"}</p>
                  </div>

                  <div className="rounded-xl bg-noa-bg/40 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Distance</p>
                    <p className="mt-2 text-sm font-semibold text-white">{test.distance_m ?? "--"}</p>
                  </div>
                </div>

                {test.notes && (
                  <div className="mt-4 rounded-xl bg-noa-bg/40 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Notes</p>
                    <p className="mt-2 text-sm leading-6 text-white">{test.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Create Test</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">New performance test</h3>
              </div>

              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-2xl border border-noa-line bg-noa-panel2 p-3 text-noa-muted transition hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Athlete</label>
                <select
                  value={formState.athlete_id}
                  onChange={(event) => setFormState((prev) => ({ ...prev, athlete_id: event.target.value }))}
                  required
                  className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                >
                  <option value="">Select athlete</option>
                  {athletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.first_name} {athlete.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Sport</label>
                  <select
                    value={formState.sport}
                    onChange={(event) => setFormState((prev) => ({ ...prev, sport: event.target.value }))}
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  >
                    <option value="swim">Swim</option>
                    <option value="bike">Bike</option>
                    <option value="run">Run</option>
                    <option value="triathlon">Triathlon</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Test type</label>
                  <input
                    value={formState.test_type}
                    onChange={(event) => setFormState((prev) => ({ ...prev, test_type: event.target.value }))}
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Metric name</label>
                  <input
                    value={formState.metric_name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, metric_name: event.target.value }))}
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Metric value</label>
                  <input
                    value={formState.metric_value}
                    onChange={(event) => setFormState((prev) => ({ ...prev, metric_value: event.target.value }))}
                    required
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Duration (sec)</label>
                  <input
                    value={formState.duration_sec}
                    onChange={(event) => setFormState((prev) => ({ ...prev, duration_sec: event.target.value }))}
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Distance (m)</label>
                  <input
                    value={formState.distance_m}
                    onChange={(event) => setFormState((prev) => ({ ...prev, distance_m: event.target.value }))}
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Performed at</label>
                  <input
                    type="datetime-local"
                    value={formState.performed_at}
                    onChange={(event) => setFormState((prev) => ({ ...prev, performed_at: event.target.value }))}
                    required
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Source</label>
                  <select
                    value={formState.source}
                    onChange={(event) => setFormState((prev) => ({ ...prev, source: event.target.value }))}
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  >
                    <option value="coach">Coach</option>
                    <option value="athlete">Athlete</option>
                    <option value="garmin">Garmin</option>
                    <option value="imported">Imported</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-white">Notes</label>
                  <textarea
                    rows={4}
                    value={formState.notes}
                    onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>

              {createError && (
                <div className="rounded-2xl border border-noa-danger/30 bg-noa-danger/10 px-4 py-3 text-sm text-noa-danger">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm font-medium text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-2xl bg-gradient-to-r from-noa-accent to-noa-blue px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {createLoading ? "Creating..." : "Create test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
