import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import { createSession, getSessions, type Session } from "../lib/api";

export default function SessionsPage() {
  const [searchParams] = useSearchParams();
  const athleteId = searchParams.get("athleteId") || "";
  const [items, setItems] = useState<Session[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "Bike",
    date: "",
    duration: "",
    load: "",
  });

  async function load() {
    const data = await getSessions(athleteId || undefined);
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [athleteId]);

  async function onCreate() {
    setSaving(true);
    try {
      await createSession({
        athlete_id: athleteId || undefined,
        title: form.title,
        type: form.type,
        date: form.date,
        duration: Number(form.duration || 0),
        load: Number(form.load || 0),
      });
      setForm({ title: "", type: "Bike", date: "", duration: "", load: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Sessions"
        subtitle="Carga de entrenamientos y visualización operativa."
      />

      <div className="mb-6 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 xl:grid-cols-5">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
          className="rounded-2xl border border-white/10 bg-[#0b1628] px-4 py-3 text-sm outline-none"
        />
        <input
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          placeholder="Type"
          className="rounded-2xl border border-white/10 bg-[#0b1628] px-4 py-3 text-sm outline-none"
        />
        <input
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          placeholder="Date"
          className="rounded-2xl border border-white/10 bg-[#0b1628] px-4 py-3 text-sm outline-none"
        />
        <input
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          placeholder="Duration"
          className="rounded-2xl border border-white/10 bg-[#0b1628] px-4 py-3 text-sm outline-none"
        />
        <div className="flex gap-3">
          <input
            value={form.load}
            onChange={(e) => setForm({ ...form, load: e.target.value })}
            placeholder="Load"
            className="w-full rounded-2xl border border-white/10 bg-[#0b1628] px-4 py-3 text-sm outline-none"
          />
          <button
            onClick={onCreate}
            disabled={saving}
            className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            {saving ? "..." : "Add"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-5 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-slate-400">
          <div>Date</div>
          <div>Title</div>
          <div>Type</div>
          <div>Duration</div>
          <div>Load</div>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-8 text-slate-300">No sessions available.</div>
        ) : (
          items.map((session) => (
            <div
              key={String(session.id)}
              className="grid grid-cols-5 border-b border-white/10 px-6 py-5 text-sm"
            >
              <div>{session.date || "-"}</div>
              <div>{session.title || "-"}</div>
              <div>{session.type || "-"}</div>
              <div>{session.duration || 0}</div>
              <div>{session.load || 0}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
