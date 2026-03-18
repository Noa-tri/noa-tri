import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarRange,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  TimerReset,
  Wifi,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { apiGet, apiPost } from "../lib/api";
import type { Athlete } from "../types/athlete";

type SyncResponse = {
  discovered: number;
  processed: number;
  skipped: number;
  failed: number;
};

export default function AthleteDetailPage() {
  const { athleteId } = useParams();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);

  useEffect(() => {
    async function loadAthlete() {
      if (!athleteId) {
        setPageError("Athlete id missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError(null);
        const data = await apiGet<Athlete>(`/athletes/${athleteId}`);
        setAthlete(data);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Failed to load athlete");
      } finally {
        setLoading(false);
      }
    }

    loadAthlete();
  }, [athleteId]);

  async function handleSyncGarmin() {
    if (!athleteId) {
      return;
    }

    try {
      setSyncLoading(true);
      setSyncError(null);
      setSyncResult(null);

      const result = await apiPost<SyncResponse>(`/sync/athletes/${athleteId}/garmin`, {});
      setSyncResult(result);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Failed to synchronize Garmin");
    } finally {
      setSyncLoading(false);
    }
  }

  if (loading) {
    return <div className="panel p-8 text-sm text-noa-muted">Loading athlete...</div>;
  }

  if (pageError || !athlete) {
    return (
      <div className="panel p-8">
        <p className="text-lg font-semibold text-white">Athlete not found</p>
        <p className="mt-2 text-sm text-noa-muted">{pageError ?? "No athlete data available."}</p>
        <Link
          to="/athletes"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-noa-accent"
        >
          <ArrowLeft size={16} />
          Back to athletes
        </Link>
      </div>
    );
  }

  const fullName = `${athlete.first_name} ${athlete.last_name}`;

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="grid gap-8 p-6 md:grid-cols-[1.35fr_0.65fr] md:p-8">
          <div>
            <Link
              to="/athletes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-noa-accent"
            >
              <ArrowLeft size={16} />
              Back to athletes
            </Link>

            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-noa-muted">Athlete Profile</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">{fullName}</h1>
            <p className="mt-3 text-sm leading-6 text-noa-muted">
              Organization: {athlete.organization_id}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleSyncGarmin}
                disabled={syncLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-noa-accent to-noa-blue px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                <Wifi size={16} />
                {syncLoading ? "Synchronizing..." : "Sync Garmin"}
              </button>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-2xl border border-noa-line bg-noa-panel2 px-5 py-3 text-sm font-semibold text-white"
              >
                <RefreshCw size={16} />
                Refresh athlete
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="metric-card">
                <p className="text-sm text-noa-muted">FTP</p>
                <p className="mt-3 text-4xl font-bold text-white">{athlete.ftp_watts ?? "--"}</p>
              </div>

              <div className="metric-card">
                <p className="text-sm text-noa-muted">Threshold HR</p>
                <p className="mt-3 text-4xl font-bold text-white">{athlete.threshold_hr ?? "--"}</p>
              </div>

              <div className="metric-card">
                <p className="text-sm text-noa-muted">VO2max</p>
                <p className="mt-3 text-4xl font-bold text-white">{athlete.vo2max ?? "--"}</p>
              </div>

              <div className="metric-card">
                <p className="text-sm text-noa-muted">Weight</p>
                <p className="mt-3 text-4xl font-bold text-white">{athlete.weight_kg ?? "--"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/5 bg-gradient-to-br from-noa-panel2 to-noa-bg p-5">
            <p className="text-sm font-medium text-white">Profile State</p>

            <div className="mt-8 flex items-end gap-3">
              <div className="text-6xl font-bold tracking-tight text-white">
                {athlete.vo2max ?? "--"}
              </div>
              <div className="pb-2 text-sm text-noa-muted">VO2max</div>
            </div>

            <p className="mt-4 text-sm leading-6 text-noa-muted">
              Real athlete data loaded from backend.
            </p>

            <div className="mt-6 rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-noa-muted">Created</span>
                <span className="text-xs font-semibold text-white">
                  {new Date(athlete.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {syncResult && (
              <div className="mt-4 rounded-2xl border border-noa-success/30 bg-noa-success/10 p-4">
                <p className="text-sm font-semibold text-noa-success">Garmin sync completed</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-noa-panel2 p-3">
                    <span className="text-noa-muted">Discovered</span>
                    <p className="mt-1 font-semibold text-white">{syncResult.discovered}</p>
                  </div>
                  <div className="rounded-xl bg-noa-panel2 p-3">
                    <span className="text-noa-muted">Processed</span>
                    <p className="mt-1 font-semibold text-white">{syncResult.processed}</p>
                  </div>
                  <div className="rounded-xl bg-noa-panel2 p-3">
                    <span className="text-noa-muted">Skipped</span>
                    <p className="mt-1 font-semibold text-white">{syncResult.skipped}</p>
                  </div>
                  <div className="rounded-xl bg-noa-panel2 p-3">
                    <span className="text-noa-muted">Failed</span>
                    <p className="mt-1 font-semibold text-white">{syncResult.failed}</p>
                  </div>
                </div>
              </div>
            )}

            {syncError && (
              <div className="mt-4 rounded-2xl border border-noa-danger/30 bg-noa-danger/10 p-4 text-sm text-noa-danger">
                {syncError}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="panel p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-accent">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Performance Zone</p>
              <p className="text-sm text-noa-muted">Connected athlete profile</p>
            </div>
          </div>

          <div className="mt-6 flex h-[340px] items-center justify-center rounded-[28px] border border-dashed border-noa-line bg-noa-panel2 text-noa-muted">
            Athlete analytics area
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-success">
                <HeartPulse size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Physiology</p>
                <p className="text-sm text-noa-muted">Current athlete baseline</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">Weight</span>
                <span className="text-sm font-semibold text-white">{athlete.weight_kg ?? "--"}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">Height</span>
                <span className="text-sm font-semibold text-white">{athlete.height_cm ?? "--"}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
                <span className="text-sm text-noa-muted">VO2max</span>
                <span className="text-sm font-semibold text-white">{athlete.vo2max ?? "--"}</span>
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-warning">
                <ShieldAlert size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Risk Engine</p>
                <p className="text-sm text-noa-muted">Pending live integration</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <p className="text-sm text-noa-muted">
                Athlete loaded correctly. Risk visualization will activate when the real metrics are connected.
              </p>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-blue">
                <CalendarRange size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Planning Status</p>
                <p className="text-sm text-noa-muted">Pending live integration</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <p className="text-sm text-noa-muted">
                Planning panel will use this athlete record once weekly planning is connected.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="panel p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-noa-panel2 p-3 text-noa-accent">
              <TimerReset size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Threshold Block</p>
              <p className="text-sm text-noa-muted">Coach baseline values</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <span className="text-sm text-noa-muted">FTP</span>
              <span className="text-sm font-semibold text-white">{athlete.ftp_watts ?? "--"}</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <span className="text-sm text-noa-muted">Threshold HR</span>
              <span className="text-sm font-semibold text-white">{athlete.threshold_hr ?? "--"}</span>
            </div>
          </div>
        </div>

        <div className="panel p-6 xl:col-span-2">
          <p className="text-lg font-semibold text-white">Athlete Overview</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <p className="text-sm text-noa-muted">First name</p>
              <p className="mt-2 text-sm font-medium text-white">{athlete.first_name}</p>
            </div>

            <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <p className="text-sm text-noa-muted">Last name</p>
              <p className="mt-2 text-sm font-medium text-white">{athlete.last_name}</p>
            </div>

            <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <p className="text-sm text-noa-muted">Organization</p>
              <p className="mt-2 break-all text-sm font-medium text-white">{athlete.organization_id}</p>
            </div>

            <div className="rounded-2xl border border-noa-line bg-noa-panel2 p-4">
              <p className="text-sm text-noa-muted">Created at</p>
              <p className="mt-2 text-sm font-medium text-white">
                {new Date(athlete.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
