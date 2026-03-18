import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Plus, Search, X } from "lucide-react";
import { Link } from "react-router-dom";

import { apiGet, apiPost } from "../lib/api";
import type { Athlete, AthleteCreatePayload } from "../types/athlete";
import type { Organization } from "../types/organization";

type AthleteFormState = {
  organization_id: string;
  first_name: string;
  last_name: string;
  weight_kg: string;
  height_cm: string;
  ftp_watts: string;
  threshold_hr: string;
  vo2max: string;
};

const initialFormState: AthleteFormState = {
  organization_id: "",
  first_name: "",
  last_name: "",
  weight_kg: "",
  height_cm: "",
  ftp_watts: "",
  threshold_hr: "",
  vo2max: "",
};

function toNullableNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function athleteStatus(athlete: Athlete): { label: string; className: string } {
  if ((athlete.vo2max ?? 0) >= 60) {
    return {
      label: "Ready",
      className: "bg-noa-success/15 text-noa-success",
    };
  }

  if ((athlete.threshold_hr ?? 0) >= 160) {
    return {
      label: "Build",
      className: "bg-noa-blue/15 text-noa-blue",
    };
  }

  return {
    label: "Pending",
    className: "bg-noa-warning/15 text-noa-warning",
  };
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formState, setFormState] = useState<AthleteFormState>(initialFormState);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function loadAthletes() {
    const data = await apiGet<Athlete[]>("/athletes/");
    setAthletes(data);
  }

  async function loadOrganizations() {
    const data = await apiGet<Organization[]>("/organizations/");
    setOrganizations(data);
    return data;
  }

  async function loadPage() {
    try {
      setLoading(true);
      setPageError(null);

      const [athletesData, organizationsData] = await Promise.all([
        apiGet<Athlete[]>("/athletes/"),
        apiGet<Organization[]>("/organizations/"),
      ]);

      setAthletes(athletesData);
      setOrganizations(organizationsData);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load athletes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  const organizationMap = useMemo(() => {
    return new Map(organizations.map((org) => [org.id, org]));
  }, [organizations]);

  const filteredAthletes = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return athletes;
    }

    return athletes.filter((athlete) => {
      const fullName = `${athlete.first_name} ${athlete.last_name}`.toLowerCase();
      const orgName = organizationMap.get(athlete.organization_id)?.name?.toLowerCase() ?? "";

      return (
        fullName.includes(term) ||
        athlete.first_name.toLowerCase().includes(term) ||
        athlete.last_name.toLowerCase().includes(term) ||
        orgName.includes(term)
      );
    });
  }, [athletes, search, organizationMap]);

  async function handleOpenCreateModal() {
    setCreateError(null);

    try {
      if (organizations.length === 0) {
        const orgs = await loadOrganizations();
        if (orgs.length === 0) {
          setCreateError("First create an organization in the Organizations section.");
        }
      }
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to load organizations");
    }

    setIsCreateOpen(true);
  }

  async function handleCreateAthlete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreateLoading(true);
    setCreateError(null);

    const payload: AthleteCreatePayload = {
      organization_id: formState.organization_id.trim(),
      first_name: formState.first_name.trim(),
      last_name: formState.last_name.trim(),
      weight_kg: toNullableNumber(formState.weight_kg),
      height_cm: toNullableNumber(formState.height_cm),
      ftp_watts: toNullableNumber(formState.ftp_watts),
      threshold_hr: toNullableNumber(formState.threshold_hr),
      vo2max: toNullableNumber(formState.vo2max),
    };

    try {
      const createdAthlete = await apiPost<Athlete>("/athletes/", payload);
      setAthletes((prev) => [createdAthlete, ...prev]);
      setFormState(initialFormState);
      setIsCreateOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create athlete");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Athlete Management</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Athletes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
              Gestión real de atletas conectada al backend de NOA TRI.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-noa-accent to-noa-blue px-4 py-3 text-sm font-semibold text-slate-950"
          >
            <Plus size={16} />
            New athlete
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3">
          <Search size={16} className="text-noa-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-noa-muted"
            placeholder="Search athlete..."
          />
        </div>
      </section>

      <section className="panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Roster</h2>
          <button
            onClick={loadPage}
            className="rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-2 text-sm font-medium text-white"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-noa-line bg-noa-panel2 p-8 text-sm text-noa-muted">
            Loading athletes...
          </div>
        ) : pageError ? (
          <div className="rounded-3xl border border-noa-danger/30 bg-noa-danger/10 p-8 text-sm text-noa-danger">
            {pageError}
          </div>
        ) : filteredAthletes.length === 0 ? (
          <div className="rounded-3xl border border-noa-line bg-noa-panel2 p-8 text-sm text-noa-muted">
            No athletes found.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {filteredAthletes.map((athlete) => {
              const status = athleteStatus(athlete);
              const organization = organizationMap.get(athlete.organization_id);

              return (
                <div key={athlete.id} className="panel p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {athlete.first_name} {athlete.last_name}
                      </p>
                      <p className="mt-1 text-sm text-noa-muted">
                        {organization?.name ?? athlete.organization_id}
                      </p>
                    </div>

                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">FTP</p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {athlete.ftp_watts ?? "--"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">THR HR</p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {athlete.threshold_hr ?? "--"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">VO2max</p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {athlete.vo2max ?? "--"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Weight</p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {athlete.weight_kg ?? "--"}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/athletes/${athlete.id}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-noa-accent"
                  >
                    Open profile
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Create Athlete</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">New athlete</h3>
              </div>

              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-2xl border border-noa-line bg-noa-panel2 p-3 text-noa-muted transition hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAthlete} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Organization</label>
                <select
                  value={formState.organization_id}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, organization_id: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                >
                  <option value="">Select organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">First name</label>
                  <input
                    value={formState.first_name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, first_name: event.target.value }))
                    }
                    required
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Last name</label>
                  <input
                    value={formState.last_name}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, last_name: event.target.value }))
                    }
                    required
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Weight (kg)</label>
                  <input
                    value={formState.weight_kg}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, weight_kg: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Height (cm)</label>
                  <input
                    value={formState.height_cm}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, height_cm: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">FTP watts</label>
                  <input
                    value={formState.ftp_watts}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, ftp_watts: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Threshold HR</label>
                  <input
                    value={formState.threshold_hr}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, threshold_hr: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">VO2max</label>
                  <input
                    value={formState.vo2max}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, vo2max: event.target.value }))
                    }
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
                  {createLoading ? "Creating..." : "Create athlete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
