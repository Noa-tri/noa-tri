const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

type Params = Record<string, string | number | boolean | undefined | null>;

function url(path: string, params?: Params) {
  const target = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        target.searchParams.set(key, String(value));
      }
    }
  }
  return target.toString();
}

async function request<T>(path: string, init?: RequestInit, params?: Params): Promise<T> {
  const response = await fetch(url(path, params), {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

export type Organization = {
  id: string | number;
  name: string;
  sport?: string;
  athletes_count?: number;
};

export type Athlete = {
  id: string | number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  sport?: string;
  status?: string;
  organization_id?: string | number;
};

export type Session = {
  id: string | number;
  title?: string;
  type?: string;
  date?: string;
  duration?: number;
  load?: number;
  athlete_id?: string | number;
};

export type Biomarker = {
  id: string | number;
  date?: string;
  hrv?: number;
  resting_hr?: number;
  sleep_score?: number;
  readiness?: number;
  fatigue?: number;
  athlete_id?: string | number;
};

export type TrainingPlan = {
  id: string | number;
  title?: string;
  objective?: string;
  week_label?: string;
  status?: string;
  athlete_id?: string | number;
};

export const api = {
  get: <T>(path: string, params?: Params) => request<T>(path, { method: "GET" }, params),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
};

export async function getDashboard() {
  try {
    return await api.get<any>("/dashboard");
  } catch {
    return {
      total_athletes: 0,
      total_sessions: 0,
      avg_readiness: 0,
      sync_status: "unknown",
    };
  }
}

export async function getOrganizations(): Promise<Organization[]> {
  try {
    return await api.get<Organization[]>("/organizations");
  } catch {
    return [{ id: 1, name: "NOA TRI", sport: "Triathlon", athletes_count: 0 }];
  }
}

export async function getAthletes(organizationId?: string): Promise<Athlete[]> {
  const data = await api.get<Athlete[]>("/athletes", organizationId ? { organization_id: organizationId } : undefined);
  return Array.isArray(data) ? data : [];
}

export async function createAthlete(payload: Partial<Athlete>) {
  return api.post<Athlete>("/athletes", payload);
}

export async function updateAthlete(id: string, payload: Partial<Athlete>) {
  return api.put<Athlete>(`/athletes/${id}`, payload);
}

export async function getSessions(athleteId?: string): Promise<Session[]> {
  const data = await api.get<Session[]>("/sessions", athleteId ? { athlete_id: athleteId } : undefined);
  return Array.isArray(data) ? data : [];
}

export async function createSession(payload: Partial<Session>) {
  return api.post<Session>("/sessions", payload);
}

export async function getBiomarkers(athleteId?: string): Promise<Biomarker[]> {
  const data = await api.get<Biomarker[]>("/biomarkers", athleteId ? { athlete_id: athleteId } : undefined);
  return Array.isArray(data) ? data : [];
}

export async function getTrainingPlans(athleteId?: string): Promise<TrainingPlan[]> {
  const data = await api.get<TrainingPlan[]>("/training-plan", athleteId ? { athlete_id: athleteId } : undefined);
  return Array.isArray(data) ? data : [];
}

export async function synchronizeGarmin(payload?: Record<string, unknown>) {
  return api.post<any>("/synchronization", payload || { source: "garmin" });
}
