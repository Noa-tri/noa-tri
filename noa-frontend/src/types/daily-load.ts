export type DailyLoad = {
  id: string;
  athlete_id: string;
  day: string;
  sport: string;
  tss: number | null;
  rtss: number | null;
  stss: number | null;
  total_load: number | null;
  source_count: number;
  data_quality_score: number | null;
  created_at: string;
  updated_at: string;
};
