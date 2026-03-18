export type TrainingSession = {
  id: string;
  athlete_id: string;
  sport: string;
  start_time: string;
  duration_sec: number | null;
  distance_m: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  avg_power_w: number | null;
  normalized_power_w: number | null;
  intensity_factor: number | null;
  tss: number | null;
};
