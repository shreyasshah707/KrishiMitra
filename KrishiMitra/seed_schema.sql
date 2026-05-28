-- KrishiMitra Seed Variety Database Schema
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS crops (
    crop_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_name     TEXT    NOT NULL UNIQUE,
    crop_name_hi  TEXT,
    category      TEXT    NOT NULL,
    season        TEXT    NOT NULL,
    created_at    TEXT    DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS agro_zones (
    zone_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_code     TEXT    NOT NULL UNIQUE,
    zone_name     TEXT    NOT NULL,
    states        TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS varieties (
    variety_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id             INTEGER NOT NULL REFERENCES crops(crop_id),
    variety_name        TEXT    NOT NULL,
    aka                 TEXT,
    release_year        INTEGER,
    notified_by         TEXT,
    maturity_days_min   INTEGER,
    maturity_days_max   INTEGER,
    yield_potential_qha REAL,
    avg_yield_qha       REAL,
    plant_height_cm     INTEGER,
    sow_doy_start       INTEGER,
    sow_doy_end         INTEGER,
    sow_month_start     TEXT,
    sow_month_end       TEXT,
    soil_ph_min         REAL,
    soil_ph_max         REAL,
    soil_types          TEXT,
    irrigation_need     TEXT,
    water_stress_tol    INTEGER DEFAULT 0,
    drought_tolerant    INTEGER DEFAULT 0,
    temp_min_c          REAL,
    temp_max_c          REAL,
    rainfall_min_mm     REAL,
    rainfall_max_mm     REAL,
    rust_resistant      INTEGER DEFAULT 0,
    blast_resistant     INTEGER DEFAULT 0,
    borer_tolerant      INTEGER DEFAULT 0,
    traits_notes        TEXT,
    msp_eligible        INTEGER DEFAULT 1,
    export_quality      INTEGER DEFAULT 0,
    seed_cost_band      TEXT,
    seed_availability   TEXT,
    data_source         TEXT,
    source_url          TEXT,
    confidence_score    REAL DEFAULT 1.0,
    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS variety_zones (
    variety_id      INTEGER NOT NULL REFERENCES varieties(variety_id),
    zone_id         INTEGER NOT NULL REFERENCES agro_zones(zone_id),
    performance     TEXT,
    PRIMARY KEY (variety_id, zone_id)
);
CREATE TABLE IF NOT EXISTS variety_states (
    variety_id      INTEGER NOT NULL REFERENCES varieties(variety_id),
    state_name      TEXT    NOT NULL,
    district_hint   TEXT,
    recommended     INTEGER DEFAULT 1,
    PRIMARY KEY (variety_id, state_name)
);
CREATE INDEX IF NOT EXISTS idx_var_crop     ON varieties(crop_id);
CREATE INDEX IF NOT EXISTS idx_var_sow      ON varieties(sow_doy_start, sow_doy_end);
CREATE INDEX IF NOT EXISTS idx_var_yield    ON varieties(avg_yield_qha DESC);
CREATE INDEX IF NOT EXISTS idx_vz_zone      ON variety_zones(zone_id);
CREATE INDEX IF NOT EXISTS idx_vs_state     ON variety_states(state_name);
