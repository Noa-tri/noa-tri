import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { getOrganizations, type Organization } from "../lib/api";

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrganizations()
      .then(setItems)
      .catch((err) => setError(err.message || "Failed to load organizations"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell
      title="Organizations"
      subtitle="Seleccioná una organización para entrar al flujo operativo completo."
    >
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
          Loading organizations...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-red-200">{error}</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((org) => (
            <button
              key={String(org.id)}
              onClick={() => navigate(`/athletes?organizationId=${org.id}`)}
              className="group rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-6 text-left transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                  {org.sport || "Performance"}
                </span>
                <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Organization</span>
              </div>

              <h3 className="text-xl font-semibold text-white">{org.name}</h3>

              <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
                <span>{org.athletes_count ?? 0} athletes</span>
                <span className="text-cyan-300 transition group-hover:translate-x-1">Open →</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  );
}
