import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAthlete, getAthletes, type Athlete } from "../lib/api";

function athleteName(a: Athlete) {
  return a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || `Athlete ${a.id}`;
}

export default function AthletesPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    sport: "Triathlon",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getAthletes();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "No se pudieron cargar los atletas");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate() {
    setError("");
    setSuccess("");

    if (!form.first_name.trim() && !form.last_name.trim()) {
      setError("Ingresá al menos nombre o apellido");
      return;
    }

    setSaving(true);

    const tempAthlete: Athlete = {
      id: `tmp-${Date.now()}`,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      sport: form.sport,
      status: "local",
    };

    try {
      const created = await createAthlete({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        sport: form.sport,
      });

      const visibleAthlete: Athlete = created?.id ? created : tempAthlete;

      setItems((prev) => [visibleAthlete, ...prev]);
      setSuccess("Atleta creado");
    } catch (e: any) {
      setItems((prev) => [tempAthlete, ...prev]);
      setSuccess("Atleta agregado localmente (backend no respondió)");
      setError(e?.message || "Failed to fetch");
    } finally {
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        sport: "Triathlon",
      });
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((a) => {
      const full = athleteName(a).toLowerCase();
      const email = (a.email || "").toLowerCase();
      const sport = (a.sport || "").toLowerCase();
      return full.includes(q) || email.includes(q) || sport.includes(q);
    });
  }, [items, query]);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">NOA TRI</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Athletes</h1>
        <p className="mt-3 text-sm text-slate-400">
          Acá se crean, se ven y se abren los dashboards individuales.
        </p>
      </div>

      <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-6">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            placeholder="First name"
            className="rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm text-white outline-none"
          />
          <input
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            placeholder="Last name"
            className="rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm text-white outline-none"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm text-white outline-none"
          />
          <input
            value={form.sport}
            onChange={(e) => setForm({ ...form, sport: e.target.value })}
            placeholder="Sport"
            className="rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm text-white outline-none"
          />
          <button
            onClick={onCreate}
            disabled={saving}
            className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Athlete"}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar atleta"
            className="w-full rounded-2xl border border-white/10 bg-[#06111f] px-4 py-3 text-sm text-white outline-none md:w-80"
          />

          <button
            onClick={load}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-6 text-slate-300">
          Loading athletes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-6 text-slate-300">
          No athletes available.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((athlete) => (
            <button
              key={String(athlete.id)}
              onClick={() => navigate(`/athletes/${athlete.id}`)}
              className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-6 text-left transition hover:border-cyan-400/40 hover:bg-[#0b1d34]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-white">{athleteName(athlete)}</h3>
                  <p className="mt-2 text-sm text-slate-400">{athlete.email || "No email"}</p>
                </div>

                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                  {athlete.sport || "Triathlon"}
                </span>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm text-slate-400">Open athlete dashboard</span>
                <span className="text-sm font-medium text-cyan-300">Enter →</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
