export type TrainingPlan = {
  id: string;
  athlete_id: string;
  sport: string;
  planned_date: string;
  planned_duration_sec: number | null;
  planned_distance_m: number | null;
  planned_intensity_factor: number | null;
  planned_tss: number | null;
  coach_notes: string | null;
};

export type TrainingPlanCreatePayload = {
  athlete_id: string;
  sport: string;
  planned_date: string;
  planned_duration_sec: number | null;
  planned_distance_m: number | null;
  planned_intensity_factor: number | null;
  planned_tss: number | null;
  coach_notes: string | null;
};
