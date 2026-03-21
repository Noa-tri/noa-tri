import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import { getOrganizations, type Organization } from "../lib/api";

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Organization[]>([]);

  useEffect(() => {
    getOrganizations().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <>
      <PageHeader
        title="Organizations"
        subtitle="Entrada operativa para navegar atletas y planificación."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((org) => (
          <button
            key={String(org.id)}
            onClick={() => navigate(`/athletes?organizationId=${org.id}`)}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:bg-white/10"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Organization</p>
            <h3 className="mt-3 text-xl font-semibold">{org.name}</h3>
            <p className="mt-2 text-sm text-slate-300">{org.sport || "Triathlon"}</p>
            <p className="mt-6 text-sm text-slate-400">{org.athletes_count ?? 0} athletes</p>
          </button>
        ))}
      </div>
    </>
  );
}
