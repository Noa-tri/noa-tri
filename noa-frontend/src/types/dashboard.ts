export type TeamDashboardAthlete = {
  id: string;
  name: string;
  ftp: number | null;
  vo2max: number | null;
  hrv_rmssd: number | null;
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
  risk: string | null;
  weekly_total_tss: number | null;
  weekly_monotony: number | null;
  weekly_strain: number | null;
};

export type AthleteLoadDashboard = {
  total_tss: number | null;
  monotony: number | null;
  strain: number | null;
};
