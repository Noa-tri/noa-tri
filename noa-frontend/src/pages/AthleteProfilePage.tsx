import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import { getAthletes, updateAthlete, type Athlete } from "../lib/api";

function athleteName(a?: Athlete) {
  if (!a) return "";
  return a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || `Athlete ${a.id}`;
}

export default function AthleteProfilePage() {
  const navigate = useNavigate();
  const { athleteId = "" } = useParams();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    sport: "",
    status: "",
  });

  useEffect(() => {
    getAthletes()
      .then((items) => {
        const found = items.find((a) => String(a.id) === String(athleteId)) || null;
        setAthlete(found);
        if (found) {
          setForm({
            first_name: found.first_name || "",
            last_name: found.last_name || "",
            email: found.email || "",
            sport: found.sport || "",
            status: found.status || "active",
          });
        }
      })
      .catch(() => setAthlete(null));
  }, [athleteId]);

  const fullName = useMemo(() => athleteName(athlete || undefined), [athlete]);

  async function onSave() {
    setSaving(true);
    try {
      await updateAthlete(String(athleteId), form);
      setAthlete({
        ...(athlete || { id: athleteId }),
        ...form,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={fullName || "Athlete Profile"}
        subtitle="Perfil editable del atleta con acceso directo a planning, sessions y metrics."
        actions={
          <>
            <button
              onClick={() => navigate(`/planning?athleteId=${athleteId}`)}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm"
            >
              Planning
            </button>
            <button
              onClick={() => navigate(`/sessions?athleteId=${athleteId}`)}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm"
            >
              Sessions
            </button>
            <button
              onClick={() => navigate(`/biomarkers?athleteId=${athleteId}`)}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-300"
            >
              Metrics
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Edit Athlete</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
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
            <input
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              placeholder="Status"
              className="rounded-2xl border border-white/10 bg-[#0b1628] px-4 py-3 text-sm outline-none"
            />
          </div>

          <button
            onClick={onSave}
            disabled={saving}
            className="mt-5 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            {saving ? "Saving..." : "Save Athlete"}
          </button>
        </div>

        <div className="grid gap-5">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <p className="text-sm text-slate-400">Athlete ID</p>
            <p className="mt-3 text-3xl font-semibold">{athleteId}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <p className="text-sm text-slate-400">Status</p>
            <p className="mt-3 text-3xl font-semibold">{form.status || "active"}</p>
          </div>
        </div>
      </div>
    </>
  );
}
