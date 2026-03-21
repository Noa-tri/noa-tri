const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, params?: QueryParams) {
  const url = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function request<T>(path: string, options?: RequestInit, params?: QueryParams): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) return {} as T;

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, params?: QueryParams) => request<T>(path, { method: "GET" }, params),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export type Organization = {
  id: string | number;
  name: string;
  sport?: string;
  athletes_count?: number;
};

export type Athlete = {
  id: string | number;
  organization_id?: string | number;
  first_name?: string;
  last_name?: string;
  name?: string;
  sport?: string;
  status?: string;
};

export type TrainingPlan = {
  id: string | number;
  athlete_id?: string | number;
  title?: string;
  week_label?: string;
  status?: string;
  objective?: string;
};

export type Session = {
  id: string | number;
  athlete_id?: string | number;
  type?: string;
  title?: string;
  date?: string;
  duration?: number;
  load?: number;
  status?: string;
};

export type Biomarker = {
  id: string | number;
  athlete_id?: string | number;
  date?: string;
  hrv?: number;
  resting_hr?: number;
  sleep_score?: number;
  readiness?: number;
  fatigue?: number;
};

export async function getOrganizations(): Promise<Organization[]> {
  try {
    return await api.get<Organization[]>("/organizations");
  } catch {
    return [
      { id: "org-1", name: "NOA TRI High Performance", sport: "Triathlon", athletes_count: 12 },
    ];
  }
}

export async function getAthletes(organizationId?: string): Promise<Athlete[]> {
  const data = await api.get<Athlete[]>("/athletes", organizationId ? { organization_id: organizationId } : undefined);
  return Array.isArray(data) ? data : [];
}

export async function getTrainingPlans(athleteId?: string): Promise<TrainingPlan[]> {
  const data = await api.get<TrainingPlan[]>("/training-plan", athleteId ? { athlete_id: athleteId } : undefined);
  return Array.isArray(data) ? data : [];
}

export async function getSessions(athleteId?: string): Promise<Session[]> {
  const data = await api.get<Session[]>("/sessions", athleteId ? { athlete_id: athleteId } : undefined);
  return Array.isArray(data) ? data : [];
}

export async function getBiomarkers(athleteId?: string): Promise<Biomarker[]> {
  const data = await api.get<Biomarker[]>("/biomarkers", athleteId ? { athlete_id: athleteId } : undefined);
  return Array.isArray(data) ? data : [];
}
