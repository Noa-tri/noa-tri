export type Biomarker = {
  athlete_id: string;
  day: string;
  hrv_rmssd_ms: number | null;
  hrv_lnrmssd: number | null;
  resting_hr: number | null;
  sleep_score: number | null;
  body_battery: number | null;
};
