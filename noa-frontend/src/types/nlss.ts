export type NLSSModel = {
  id: string;
  athlete_id: string;
  model_type: string;
  sport: string;
  k1: number | null;
  k2: number | null;
  t1: number | null;
  t2: number | null;
  fit_error: number | null;
  data_points: number | null;
  window_start: string | null;
  window_end: string | null;
  calibration_date: string;
  created_at?: string;
};
