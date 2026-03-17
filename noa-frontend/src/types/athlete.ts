export type Athlete = {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  weight_kg: number | null;
  height_cm: number | null;
  ftp_watts: number | null;
  threshold_hr: number | null;
  vo2max: number | null;
  created_at: string;
};

export type AthleteCreatePayload = {
  organization_id: string;
  first_name: string;
  last_name: string;
  weight_kg: number | null;
  height_cm: number | null;
  ftp_watts: number | null;
  threshold_hr: number | null;
  vo2max: number | null;
};
