export type PerformanceTest = {
  id: string;
  athlete_id: string;
  sport: string;
  test_type: string;
  metric_name: string;
  metric_value: number;
  duration_sec: number | null;
  distance_m: number | null;
  performed_at: string;
  source: string;
  validated: boolean;
  notes: string | null;
  created_at: string;
};

export type PerformanceTestCreatePayload = {
  athlete_id: string;
  sport: string;
  test_type: string;
  metric_name: string;
  metric_value: number;
  duration_sec: number | null;
  distance_m: number | null;
  performed_at: string;
  source: string;
  validated: boolean;
  notes: string | null;
};
