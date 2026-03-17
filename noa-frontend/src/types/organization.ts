export type Organization = {
  id: string;
  name: string;
  slug: string;
  country_code: string | null;
  timezone: string;
  created_at: string;
};

export type OrganizationCreatePayload = {
  name: string;
  slug: string;
  country_code: string | null;
  timezone: string;
};
