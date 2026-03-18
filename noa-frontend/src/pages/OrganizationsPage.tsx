import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search, X } from "lucide-react";

import { apiGet, apiPost } from "../lib/api";
import type { Organization, OrganizationCreatePayload } from "../types/organization";

type OrganizationFormState = {
  name: string;
  slug: string;
  country_code: string;
  timezone: string;
};

const initialFormState: OrganizationFormState = {
  name: "",
  slug: "",
  country_code: "",
  timezone: "UTC",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formState, setFormState] = useState<OrganizationFormState>(initialFormState);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function loadOrganizations() {
    try {
      setLoading(true);
      setPageError(null);
      const data = await apiGet<Organization[]>("/organizations/");
      setOrganizations(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  const filteredOrganizations = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return organizations;
    }

    return organizations.filter((org) => {
      return (
        org.name.toLowerCase().includes(term) ||
        org.slug.toLowerCase().includes(term) ||
        (org.country_code ?? "").toLowerCase().includes(term)
      );
    });
  }, [organizations, search]);

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreateLoading(true);
    setCreateError(null);

    const payload: OrganizationCreatePayload = {
      name: formState.name.trim(),
      slug: formState.slug.trim(),
      country_code: formState.country_code.trim() || null,
      timezone: formState.timezone.trim() || "UTC",
    };

    try {
      const created = await apiPost<Organization>("/organizations/", payload);
      setOrganizations((prev) => [created, ...prev]);
      setFormState(initialFormState);
      setIsCreateOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create organization");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Structure</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Organizations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-noa-muted">
              Equipos, estructuras o unidades de coaching sobre las que se organizan los atletas.
            </p>
          </div>

          <button
            onClick={() => {
              setCreateError(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-noa-accent to-noa-blue px-4 py-3 text-sm font-semibold text-slate-950"
          >
            <Plus size={16} />
            New organization
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3">
          <Search size={16} className="text-noa-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-noa-muted"
            placeholder="Search organization..."
          />
        </div>
      </section>

      <section className="panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Organizations</h2>
          <button
            onClick={loadOrganizations}
            className="rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-2 text-sm font-medium text-white"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-noa-line bg-noa-panel2 p-8 text-sm text-noa-muted">
            Loading organizations...
          </div>
        ) : pageError ? (
          <div className="rounded-3xl border border-noa-danger/30 bg-noa-danger/10 p-8 text-sm text-noa-danger">
            {pageError}
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="rounded-3xl border border-noa-line bg-noa-panel2 p-8 text-sm text-noa-muted">
            No organizations found.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {filteredOrganizations.map((organization) => (
              <div key={organization.id} className="panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{organization.name}</p>
                    <p className="mt-1 text-sm text-noa-muted">{organization.slug}</p>
                  </div>

                  <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-accent">
                    <Building2 size={18} />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Country</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {organization.country_code ?? "--"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">Timezone</p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {organization.timezone}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-noa-muted">ID</p>
                    <p className="mt-2 break-all text-xs font-medium text-white">
                      {organization.id}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-noa-muted">Create Organization</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">New organization</h3>
              </div>

              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-2xl border border-noa-line bg-noa-panel2 p-3 text-noa-muted transition hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrganization} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Name</label>
                <input
                  value={formState.name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFormState((prev) => ({
                      ...prev,
                      name: value,
                      slug: prev.slug ? prev.slug : slugify(value),
                    }));
                  }}
                  required
                  className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  placeholder="NOA TRI Performance"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">Slug</label>
                <input
                  value={formState.slug}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, slug: slugify(event.target.value) }))
                  }
                  required
                  className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                  placeholder="noa-tri-performance"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Country code</label>
                  <input
                    value={formState.country_code}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        country_code: event.target.value.toUpperCase(),
                      }))
                    }
                    maxLength={2}
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                    placeholder="AR"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white">Timezone</label>
                  <input
                    value={formState.timezone}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, timezone: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 text-white outline-none"
                    placeholder="America/Argentina/Buenos_Aires"
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
                  {createLoading ? "Creating..." : "Create organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
