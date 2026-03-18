import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarRange, Plus, RefreshCw, X } from "lucide-react";

import { apiGet, apiPost } from "../lib/api";
import type { Athlete } from "../types/athlete";
import type { TrainingPlan, TrainingPlanCreatePayload } from "../types/training-plan";

type PlanFormState = {
  athlete_id: string;
  sport: string;
  planned_date: string;
  planned_duration_sec: string;
  planned_distance_m: string;
  planned_intensity_factor: string;
  planned_tss: string;
  coach_notes: string;
};

const initialFormState: PlanFormState = {
  athlete_id: "",
  sport: "bike",
  planned_date: "",
  planned_duration_sec: "",
  planned_distance_m: "",
  planned_intensity_factor: "",
  planned_tss: "",
  coach_notes: "",
};

function toNullableNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatDuration(durationSec: number | null): string {
  if (!durationSec || durationSec <= 0) {
    return "--";
  }

  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatDistance(distanceMeters: number | null): string {
  if (distanceMeters == null) {
    return "--";
  }

  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

export default function PlanningPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [plans, setPlans] = useState<TrainingPlan[]>([]);

  const [athletesLoading, setAthletesLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);
  const [plansError, setPlansError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formState, setFormState] = useState<PlanFormState>(initialFormState);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  async function loadPlans(athleteId: string) {
    if (!athleteId) {
      setPlans([]);
      return;
    }

    try {
      setPlansLoading(true);
      setPlansError(null);

      const data = await apiGet<TrainingPlan[]>(`/training-plan/${athleteId}`);
      setPlans(data);
    } catch (error) {
      setPlansError(error instanceof Error ? error.message : "Failed to load training plans");
    } finally {
      setPlansLoading(false);
    }
  }

  useEffect(() => {
    loadPlans(selectedAthleteId);
  }, [selectedAthleteId]);

  const selectedAthlete = useMemo(() => {
    return athletes.find((athlete) => athlete.id === selectedAthleteId) ?? null;
  }, [athletes, selectedAthleteId]);

  async function handleOpenCreateModal() {
    setCreateError(null);
    setFormState((prev) => ({
      ...initialFormState,
      athlete_id: selectedAthleteId || prev.athlete_id,
    }));
    setIsCreateOpen(true);
  }

  async function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreateLoading(true);
    setCreateError(null);

    const payload: TrainingPlanCreatePayload = {
      athlete_id: formState.athlete_id,
      sport: formState.sport.trim(),
      planned_date: formState.planned_date,
      planned_duration_sec: toNullableNumber(formState.planned_duration_sec),
      planned_distance_m: toNullableNumber(formState.planned_distance_m),
      planned_intensity_factor: toNullableNumber(formState.planned_intensity_factor),
      planned_tss: toNullableNumber(formState.planned_tss),
      coach_notes: formState.coach_notes.trim() || null,
    };

    try {
      const created = await apiPost<TrainingPlan>("/training-plan", payload);
      setPlans((prev) => [created, ...prev]);
      setFormState(initialFormState);
      setIsCreateOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create training plan");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Adaptive Planning</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Planning</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
              Planificación real por atleta conectada al backend de NOA TRI.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-noa-accent to-noa-blue px-4 py-3 text-sm font-semibold text-slate-950"
          >
            <Plus size={16} />
            New plan
          </button>
        </div>

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
            onClick={() => loadPlans(selectedAthleteId)}
            className="inline-flex items-center gap-2 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm font-medium text-white"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {selectedAthlete && (
          <div className="mt-4 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-sm text-noa-muted">
            Showing planning for{" "}
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

        {plansError && (
          <div className="mt-4 rounded-2xl border border-noa-danger/30 bg-noa-danger/10 px-4 py-3 text-sm text-noa-danger">
            {plansError}
          </div>
        )}
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-noa-line px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-blue">
              <CalendarRange size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Training plans</h2>
              <p className="text-sm text-noa-muted">Real plans stored in backend</p>
            </div>
          </div>
        </div>

        {plansLoading ? (
          <div className="p-6 text-sm text-noa-muted">Loading training plans...</div>
        ) : plans.length === 0 ? (
          <div className="p-6 text-sm text-noa-muted">No training plans found for this athlete.</div>
        ) : (
          <div className="grid gap-4 p-6 xl:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-3xl border border-noa-line bg-noa-panel2 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-noa-muted">
                      {plan.sport}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {new Date(plan.planned_date).toLocaleString()}
                    </p>
                  </div>

                  <span className="rounded-full bg-noa-accent/15 px-3 py-1 text-xs font-semibold text-noa-accent">
                    Planned
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-noa-line bg-noa-bg/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Duration</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {formatDuration(plan.planned_duration_sec)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-noa-line bg-noa-bg/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Distance</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {formatDistance(plan.planned_distance_m)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-noa-line bg-noa-bg/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">IF</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {plan.planned_intensity_factor ?? "--"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-noa-line bg-noa-bg/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">TSS</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {plan.planned_tss ?? "--"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-noa-line bg-noa-bg/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Coach notes</p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    {plan.coach_notes || "--"}
                  </p>
                </div>
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
                <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Create Plan</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">New training plan</h3>
              </div>

              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-2xl border border-noa-line bg-noa-panel2 p-3 text-noa-muted transition hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Athlete</label>
                <select
                  value={formState.athlete_id}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, athlete_id: event.target.value }))
                  }
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
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, sport: event.target.value }))
                    }
                    required
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  >
                    <option value="swim">Swim</option>
                    <option value="bike">Bike</option>
                    <option value="run">Run</option>
                    <option value="triathlon">Triathlon</option>
                    <option value="strength">Strength</option>
                    <option value="mobility">Mobility</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Planned date</label>
                  <input
                    type="datetime-local"
                    value={formState.planned_date}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, planned_date: event.target.value }))
                    }
                    required
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Duration (sec)</label>
                  <input
                    value={formState.planned_duration_sec}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, planned_duration_sec: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Distance (m)</label>
                  <input
                    value={formState.planned_distance_m}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, planned_distance_m: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Intensity factor</label>
                  <input
                    value={formState.planned_intensity_factor}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        planned_intensity_factor: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Planned TSS</label>
                  <input
                    value={formState.planned_tss}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, planned_tss: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-white">Coach notes</label>
                  <textarea
                    value={formState.coach_notes}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, coach_notes: event.target.value }))
                    }
                    rows={4}
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
                  {createLoading ? "Creating..." : "Create plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
