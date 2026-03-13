CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- ENUMS
-- =========================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'org_admin', 'coach', 'athlete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE athlete_sex AS ENUM ('male', 'female', 'other', 'undisclosed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE connection_provider AS ENUM ('garmin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_sport AS ENUM ('triathlon', 'swim', 'bike', 'run', 'strength', 'mobility', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_source AS ENUM ('garmin_api', 'fit_import', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'moderate', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('pending', 'running', 'success', 'partial', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =========================================================
-- CORE TENANCY
-- =========================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    country_code CHAR(2),
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    role user_role NOT NULL,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_org_role
ON users (organization_id, role);

CREATE TABLE IF NOT EXISTS coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    credentials TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS athletes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    external_ref VARCHAR(120),
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    birth_date DATE,
    sex athlete_sex NOT NULL DEFAULT 'undisclosed',
    weight_kg NUMERIC(5,2),
    height_cm NUMERIC(5,2),
    ftp_watts INTEGER,
    threshold_hr INTEGER,
    resting_hr INTEGER,
    vo2max NUMERIC(5,2),
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, external_ref)
);

CREATE INDEX IF NOT EXISTS idx_athletes_org
ON athletes (organization_id);

CREATE TABLE IF NOT EXISTS coach_athlete_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (coach_id, athlete_id)
);

-- =========================================================
-- DEVICE CONNECTIONS / AUTH
-- =========================================================

CREATE TABLE IF NOT EXISTS device_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    provider connection_provider NOT NULL,
    provider_user_id VARCHAR(255),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_device_connections_provider_user
ON device_connections (provider, provider_user_id);

-- =========================================================
-- TRAINING SESSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    provider connection_provider,
    provider_activity_id VARCHAR(255),
    source session_source NOT NULL,
    sport session_sport NOT NULL,
    session_name VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_sec INTEGER NOT NULL CHECK (duration_sec >= 0),
    moving_time_sec INTEGER CHECK (moving_time_sec >= 0),
    distance_m NUMERIC(12,2) CHECK (distance_m >= 0),
    elevation_gain_m NUMERIC(10,2),
    avg_hr INTEGER CHECK (avg_hr >= 0),
    max_hr INTEGER CHECK (max_hr >= 0),
    avg_power_w INTEGER CHECK (avg_power_w >= 0),
    max_power_w INTEGER CHECK (max_power_w >= 0),
    normalized_power_w NUMERIC(8,2),
    intensity_factor NUMERIC(6,4),
    tss NUMERIC(8,2),
    avg_speed_mps NUMERIC(8,3),
    max_speed_mps NUMERIC(8,3),
    avg_cadence NUMERIC(8,2),
    max_cadence NUMERIC(8,2),
    calories_kj NUMERIC(10,2),
    fit_file_path TEXT,
    fit_file_checksum VARCHAR(128),
    hrv_quality_score NUMERIC(5,2),
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_activity_id)
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_athlete_start
ON training_sessions (athlete_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_training_sessions_sport
ON training_sessions (sport);

-- =========================================================
-- HIGH-FREQUENCY STREAMS (TIMESCALE HYPERTABLE)
-- =========================================================

CREATE TABLE IF NOT EXISTS session_streams (
    ts TIMESTAMPTZ NOT NULL,
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    seq_no INTEGER,
    elapsed_sec NUMERIC(10,3),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    altitude_m NUMERIC(8,2),
    speed_mps NUMERIC(8,3),
    heart_rate_bpm INTEGER,
    power_w INTEGER,
    cadence_rpm NUMERIC(8,2),
    temperature_c NUMERIC(5,2),
    vertical_oscillation_cm NUMERIC(6,2),
    ground_contact_time_ms NUMERIC(7,2),
    stance_time_balance_pct NUMERIC(5,2),
    step_length_m NUMERIC(6,3),
    respiration_rate_bpm NUMERIC(6,2),
    grade_pct NUMERIC(6,2),
    raw_record JSONB,
    PRIMARY KEY (ts, session_id)
);

SELECT create_hypertable(
    'session_streams',
    'ts',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_session_streams_session_ts
ON session_streams (session_id, ts DESC);

CREATE INDEX IF NOT EXISTS idx_session_streams_athlete_ts
ON session_streams (athlete_id, ts DESC);

-- =========================================================
-- RR INTERVALS / HRV RAW + DERIVED
-- =========================================================

CREATE TABLE IF NOT EXISTS hrv_readings (
    ts TIMESTAMPTZ NOT NULL,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
    context VARCHAR(32) NOT NULL DEFAULT 'session', -- session, morning, sleep
    rr_ms INTEGER NOT NULL CHECK (rr_ms BETWEEN 250 AND 2500),
    cleaned_rr_ms INTEGER CHECK (cleaned_rr_ms BETWEEN 250 AND 2500),
    is_artifact BOOLEAN NOT NULL DEFAULT FALSE,
    is_ectopic BOOLEAN NOT NULL DEFAULT FALSE,
    quality_score NUMERIC(5,2),
    source session_source NOT NULL DEFAULT 'fit_import',
    PRIMARY KEY (ts, athlete_id, rr_ms)
);

SELECT create_hypertable(
    'hrv_readings',
    'ts',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '14 days'
);

CREATE INDEX IF NOT EXISTS idx_hrv_readings_athlete_ts
ON hrv_readings (athlete_id, ts DESC);

CREATE INDEX IF NOT EXISTS idx_hrv_readings_session
ON hrv_readings (session_id);

CREATE TABLE IF NOT EXISTS daily_biomarkers (
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    hrv_rmssd_ms NUMERIC(8,3),
    hrv_lnrmssd NUMERIC(8,5),
    resting_hr INTEGER CHECK (resting_hr >= 0),
    sleep_score NUMERIC(6,2),
    body_battery NUMERIC(6,2),
    stress_score NUMERIC(6,2),
    sleep_duration_min INTEGER CHECK (sleep_duration_min >= 0),
    readiness_score NUMERIC(6,2),
    weight_kg NUMERIC(5,2),
    source connection_provider,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (athlete_id, day)
);

CREATE INDEX IF NOT EXISTS idx_daily_biomarkers_day
ON daily_biomarkers (day DESC);

-- =========================================================
-- DAILY LOAD / PMC
-- =========================================================

CREATE TABLE IF NOT EXISTS pmc_metrics (
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    daily_tss NUMERIC(8,2) NOT NULL DEFAULT 0,
    ctl NUMERIC(8,3) NOT NULL DEFAULT 0,
    atl NUMERIC(8,3) NOT NULL DEFAULT 0,
    tsb NUMERIC(8,3) NOT NULL DEFAULT 0,
    monotony NUMERIC(8,3),
    strain NUMERIC(10,3),
    load_source VARCHAR(32) NOT NULL DEFAULT 'power_or_hr',
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (athlete_id, day)
);

CREATE INDEX IF NOT EXISTS idx_pmc_metrics_day
ON pmc_metrics (day DESC);

-- =========================================================
-- RISK OUTPUT
-- =========================================================

CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    risk_level risk_level NOT NULL,
    risk_score NUMERIC(6,2) NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    hrv_zscore NUMERIC(8,4),
    atl_ctl_ratio NUMERIC(8,4),
    tsb NUMERIC(8,3),
    hrv_persistence_days INTEGER DEFAULT 0,
    sleep_penalty NUMERIC(6,2),
    rationale JSONB NOT NULL,
    generated_by VARCHAR(64) NOT NULL DEFAULT 'noa_analytics_core',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (athlete_id, day)
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_day_level
ON risk_assessments (day DESC, risk_level);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_athlete_day
ON risk_assessments (athlete_id, day DESC);

-- =========================================================
-- INGESTION / OBSERVABILITY
-- =========================================================

CREATE TABLE IF NOT EXISTS ingestion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES device_connections(id) ON DELETE SET NULL,
    provider connection_provider NOT NULL,
    operation VARCHAR(64) NOT NULL, -- sync_activities, fetch_fit, fetch_daily_metrics
    status sync_status NOT NULL DEFAULT 'pending',
    requested_from TIMESTAMPTZ,
    requested_to TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    items_received INTEGER NOT NULL DEFAULT 0,
    items_processed INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    context JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_athlete_created
ON ingestion_logs (athlete_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ingestion_logs_status
ON ingestion_logs (status, created_at DESC);

-- =========================================================
-- OPTIONAL MATERIALIZED VIEW FOR DASHBOARD
-- =========================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS athlete_risk_dashboard_mv AS
SELECT
    a.id AS athlete_id,
    a.organization_id,
    a.first_name,
    a.last_name,
    ra.day,
    ra.risk_level,
    ra.risk_score,
    ra.hrv_zscore,
    ra.atl_ctl_ratio,
    ra.tsb,
    pm.ctl,
    pm.atl,
    db.hrv_lnrmssd,
    db.sleep_score,
    db.body_battery
FROM athletes a
LEFT JOIN risk_assessments ra
    ON ra.athlete_id = a.id
LEFT JOIN pmc_metrics pm
    ON pm.athlete_id = a.id AND pm.day = ra.day
LEFT JOIN daily_biomarkers db
    ON db.athlete_id = a.id AND db.day = ra.day;

-- REFRESH MATERIALIZED VIEW athlete_risk_dashboard_mv;
