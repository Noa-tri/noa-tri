import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAthlete, getAthletes, type Athlete } from "../lib/api";

function name(a: Athlete) {
  return a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || `Athlete ${a.id}`;
}

export default function AthletesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    sport: "Triathlon",
  });

  async function load() {
    setLoading(true);
    const data = await getAthletes();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate() {
    await createAthlete(form);
    setForm({ first_name: "", last_name: "", email: "", sport: "Triathlon" });
    await load();
  }

  return (
    <div className="space-y-6 text-white">
      <h1 className="text-3xl font-semibold">Athletes</h1>

      {/* FORM */}
      <div className="grid gap-3 md:grid-cols-5">
        <input
          placeholder="First name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          className="bg-black/30 p-3"
        />
        <input
          placeholder="Last name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          className="bg-black/30 p-3"
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="bg-black/30 p-3"
        />
        <input
          placeholder="Sport"
          value={form.sport}
          onChange={(e) => setForm({ ...form, sport: e.target.value })}
          className="bg-black/30 p-3"
        />
        <button onClick={onCreate} className="bg-cyan-400 text-black font-bold">
          CREATE
        </button>
      </div>

      {/* LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((a) => (
            <div key={String(a.id)} className="border p-4">
              <h2 className="text-xl">{name(a)}</h2>
              <p>{a.email}</p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate(`/athletes/${a.id}`)}
                  className="bg-white text-black px-3 py-1"
                >
                  Profile
                </button>

                <button
                  onClick={() => navigate(`/sessions?athleteId=${a.id}`)}
                  className="bg-cyan-400 text-black px-3 py-1"
                >
                  Sessions
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
