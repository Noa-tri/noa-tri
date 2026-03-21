import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAthletes,
  getBiomarkers,
  getSessions,
  type Athlete,
  type Biomarker,
  type Session,
} from "../lib/api";

function athleteName(a?: Athlete | null) {
  if (!a) return "Athlete";
  return a.name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || `Athlete ${a.id}`;
}

function lower(value?: string) {
  return (value || "").toLowerCase();
}

export default function AthleteDetailPage() {
  const navigate = useNavigate();
  const { athleteId = "" } = useParams();

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [athletesData, sessionsData, biomarkersData] = await Promise.all([
          getAthletes(),
          getSessions(athleteId),
          getBiomarkers(athleteId),
        ]);

        const found = athletesData.find((a) => String(a.id) === String(athleteId)) || null;

        setAthlete(found);
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        setBiomarkers(Array.isArray(biomarkersData) ? biomarkersData : []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [athleteId]);

  const latestBiomarker = biomarkers[0];

  const summary = useMemo(() => {
    let swim = 0;
    let bike = 0;
    let run = 0;
    let totalLoad = 0;
    let totalDuration = 0;

    for (const s of sessions) {
      const type = lower(s.type);
      const load = Number(s.load || 0);
      const duration = Number(s.duration || 0);

      totalLoad += load;
      totalDuration += duration;

      if (type.includes("swim")) swim += load;
      else if (type.includes("bike") || type.includes("ride") || type.includes("cycling")) bike += load;
      else if (type.includes("run")) run += load;
    }

    const atl = Math.round(totalLoad * 0.9);
    const ctl = Math.round(totalLoad * 0.7);
    const tsb = ctl - atl;

    return {
      swim,
      bike,
      run,
      totalLoad,
      totalDuration,
      atl,
      ctl,
      tsb,
    };
  }, [sessions]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-8 text-slate-300">
        Loading athlete dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">NOA TRI</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">{athleteName(athlete)}</h1>
            <p className="mt-3 text-sm text-slate-400">
              Dashboard individual del atleta para revisar cargas y decidir la planificación.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/athletes")}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              Back to Athletes
            </button>
            <button
              onClick={() => navigate(`/planning?athleteId=${athleteId}`)}
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Plan Week
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="CTL" value={summary.ctl} />
        <MetricCard label="ATL" value={summary.atl} />
        <MetricCard label="TSB" value={summary.tsb} />
        <MetricCard label="Readiness" value={latestBiomarker?.readiness ?? "--"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SportCard
          title="Swim"
          value={summary.swim}
          action={() => navigate(`/planning?athleteId=${athleteId}&sport=swim`)}
        />
        <SportCard
          title="Bike"
          value={summary.bike}
          action={() => navigate(`/planning?athleteId=${athleteId}&sport=bike`)}
        />
        <SportCard
          title="Run"
          value={summary.run}
          action={() => navigate(`/planning?athleteId=${athleteId}&sport=run`)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-6">
          <h2 className="text-2xl font-semibold text-white">Session Load Overview</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <SmallCard label="Sessions" value={sessions.length} />
            <SmallCard label="Total Duration" value={summary.totalDuration} />
            <SmallCard label="Total Load" value={summary.totalLoad} />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-4 bg-[#06111f] px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
              <div>Date</div>
              <div>Type</div>
              <div>Duration</div>
              <div>Load</div>
            </div>

            {sessions.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-300">No sessions loaded yet.</div>
            ) : (
              sessions.slice(0, 8).map((session) => (
                <div
                  key={String(session.id)}
                  className="grid grid-cols-4 border-t border-white/10 px-4 py-4 text-sm text-slate-200"
                >
                  <div>{session.date || "-"}</div>
                  <div>{session.type || "-"}</div>
                  <div>{session.duration || 0}</div>
                  <div>{session.load || 0}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-6">
          <h2 className="text-2xl font-semibold text-white">Biomarkers</h2>

          <div className="mt-5 grid gap-4">
            <SmallCard label="HRV" value={latestBiomarker?.hrv ?? "--"} />
            <SmallCard label="Resting HR" value={latestBiomarker?.resting_hr ?? "--"} />
            <SmallCard label="Sleep Score" value={latestBiomarker?.sleep_score ?? "--"} />
            <SmallCard label="Fatigue" value={latestBiomarker?.fatigue ?? "--"} />
          </div>

          <button
            onClick={() => navigate(`/biomarkers?athleteId=${athleteId}`)}
            className="mt-6 w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-300"
          >
            Open Full Metrics
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SmallCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#06111f] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SportCard({
  title,
  value,
  action,
}: {
  title: string;
  value: string | number;
  action: () => void;
}) {
  return (
    <button
      onClick={action}
      className="rounded-[28px] border border-cyan-500/20 bg-[#08172a] p-6 text-left transition hover:border-cyan-400/40 hover:bg-[#0b1d34]"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Discipline</p>
      <h3 className="mt-3 text-3xl font-semibold text-white">{title}</h3>
      <p className="mt-4 text-sm text-slate-400">Current accumulated load</p>
      <p className="mt-2 text-4xl font-semibold text-white">{value}</p>
      <p className="mt-6 text-sm font-medium text-cyan-300">Open planning →</p>
    </button>
  );
}
