import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import { createAthlete, getAthletes, type Athlete } from "../lib/api";

function getAthleteName(a: Athlete) {
  return a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || `Athlete ${a.id}`;
}

export default function AthletesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get("organizationId") || "";
  const [items, setItems] = useState<Athlete[]>([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    sport: "Triathlon",
  });

  async function load() {
    const data = await getAthletes(organizationId || undefined);
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [organizationId]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((a) => getAthleteName(a).toLowerCase().includes(q));
  }, [items, query]);

  async function onCreate() {
    setSaving(true);
    try {
      await createAthlete({
        ...form,
        organization_id: organizationId || undefined,
      });
      setForm({ first_name: "", last_name: "", email: "", sport: "Triathlon" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Athletes"
        subtitle="Alta, navegación y acceso al perfil del atleta."
        actions={
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar atleta"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />
        }
      />

      <div className="mb-6 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 xl:grid-cols-5">
        <input
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          placeholder="First name"
          className="rounded-2xl border border-white/10 bg-[#0b1628] px-4 py-3 text-sm outline-none"
        />
        <input
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          placeholder="Last name"
          className="rounded-2xl border border-white/10 bg-[#0b1628] px-4 py-3 text-sm outline-none"
        />
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="rounded-2xl border border-white/10 bg-[#0b1628] px-4 py-3 text-sm outline-none"
        />
        <input
          value={form.sport}
          onChange={(e) => setForm({ ...form, sport: e.target.value })}
          placeholder="Sport"
          className="rounded-2xl border border-white/10 bg-[#0b1628] px-4 py-3 text-sm outline-none"
        />
        <button
          onClick={onCreate}
          disabled={saving}
          className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
        >
          {saving ? "Saving..." : "Create Athlete"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((athlete) => (
          <div
            key={String(athlete.id)}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <h3 className="text-xl font-semibold">{getAthleteName(athlete)}</h3>
            <p className="mt-2 text-sm text-slate-300">{athlete.sport || "Triathlon"}</p>
            <p className="mt-1 text-sm text-slate-400">{athlete.email || "-"}</p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigate(`/athletes/${athlete.id}`)}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-300"
              >
                View Profile
              </button>
              <button
                onClick={() => navigate(`/planning?athleteId=${athlete.id}`)}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm"
              >
                Planning
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
