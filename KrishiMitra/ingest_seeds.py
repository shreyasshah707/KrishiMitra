"""
KrishiMitra — Seed Variety Ingestion Pipeline
Run: python ingest_seeds.py --mode static
"""
import sqlite3
import json
import argparse
from pathlib import Path
from typing import Optional
DB_PATH  = Path("data/seed_db/varieties.db")
SQL_PATH = Path("seed_schema.sql")
def get_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
def init_db(conn):
    with open(SQL_PATH) as f:
        conn.executescript(f.read())
    conn.commit()
    print("✓ Schema initialised")
def upsert_crop(conn, name, name_hi, category, season):
    row = conn.execute("SELECT crop_id FROM crops WHERE crop_name=?", (name,)).fetchone()
    if row:
        return row[0]
    cur = conn.execute(
        "INSERT INTO crops(crop_name, crop_name_hi, category, season) VALUES(?,?,?,?)",
        (name, name_hi, category, season)
    )
    conn.commit()
    return cur.lastrowid
def upsert_zone(conn, code, name, states):
    row = conn.execute("SELECT zone_id FROM agro_zones WHERE zone_code=?", (code,)).fetchone()
    if row:
        return row[0]
    cur = conn.execute(
        "INSERT INTO agro_zones(zone_code, zone_name, states) VALUES(?,?,?)",
        (code, name, json.dumps(states))
    )
    conn.commit()
    return cur.lastrowid
def insert_variety(conn, data):
    cols = ", ".join(data.keys())
    placeholders = ", ".join(["?"] * len(data))
    try:
        cur = conn.execute(
            f"INSERT OR REPLACE INTO varieties ({cols}) VALUES ({placeholders})",
            list(data.values())
        )
        conn.commit()
        return cur.lastrowid
    except Exception as e:
        print(f"  ✗ Failed inserting {data.get('variety_name')}: {e}")
        return None
def link_zones(conn, variety_id, zone_codes, performance="good"):
    for code in zone_codes:
        row = conn.execute("SELECT zone_id FROM agro_zones WHERE zone_code=?", (code,)).fetchone()
        if row:
            conn.execute(
                "INSERT OR IGNORE INTO variety_zones(variety_id, zone_id, performance) VALUES(?,?,?)",
                (variety_id, row[0], performance)
            )
    conn.commit()
def link_states(conn, variety_id, states):
    for state in states:
        conn.execute(
            "INSERT OR IGNORE INTO variety_states(variety_id, state_name) VALUES(?,?)",
            (variety_id, state)
        )
    conn.commit()
def seed_static_data(conn):
    print("\n── Loading static ICAR variety data ──")
    zones = [
        ("NW", "North-West Plains",           ["Punjab", "Haryana", "Western UP", "Delhi", "Rajasthan"]),
        ("NE", "North-East Plains",            ["Bihar", "Eastern UP", "West Bengal", "Assam", "Odisha"]),
        ("C",  "Central India",                ["Madhya Pradesh", "Chhattisgarh", "Jharkhand"]),
        ("P",  "Peninsular / Deccan",          ["Maharashtra", "Karnataka", "Andhra Pradesh", "Telangana"]),
        ("S",  "Southern Plains",              ["Tamil Nadu", "Kerala", "Puducherry"]),
        ("WC", "Western Coast",                ["Gujarat", "Goa", "Coastal Maharashtra"]),
        ("H",  "Hills & Himalayan Foothills",  ["Uttarakhand", "Himachal Pradesh", "J&K", "North-East States"]),
    ]
    zone_ids = {code: upsert_zone(conn, code, name, states) for code, name, states in zones}
    print(f"  ✓ {len(zones)} agro-zones loaded")
    # ── Wheat ────────────────────────────────────────────────────────────────
    wheat_id = upsert_crop(conn, "wheat", "गेहूँ", "cereal", "rabi")
    wheat_varieties = [
        {"variety_name": "HD-2967",   "aka": "Pusa Bahar",   "release_year": 2011, "notified_by": "ICAR-IARI",
         "maturity_days_min": 118, "maturity_days_max": 125, "yield_potential_qha": 58.0, "avg_yield_qha": 48.0,
         "sow_doy_start": 288, "sow_doy_end": 330, "sow_month_start": "October", "sow_month_end": "November",
         "soil_ph_min": 6.0, "soil_ph_max": 7.5, "soil_types": json.dumps(["loamy","clay loam","sandy loam"]),
         "irrigation_need": "irrigated", "temp_min_c": 10.0, "temp_max_c": 25.0,
         "rainfall_min_mm": 250, "rainfall_max_mm": 500, "rust_resistant": 1,
         "traits_notes": "Yellow rust resistant; good chapati quality",
         "msp_eligible": 1, "seed_cost_band": "low", "seed_availability": "NSC",
         "data_source": "ICAR_IARI", "source_url": "https://www.iari.res.in/wheat", "crop_id": wheat_id},
        {"variety_name": "HD-3086",   "aka": "Pusa Gautami", "release_year": 2014, "notified_by": "ICAR-IARI",
         "maturity_days_min": 105, "maturity_days_max": 115, "yield_potential_qha": 55.0, "avg_yield_qha": 44.0,
         "sow_doy_start": 295, "sow_doy_end": 335, "sow_month_start": "October", "sow_month_end": "November",
         "soil_ph_min": 6.0, "soil_ph_max": 7.8, "soil_types": json.dumps(["loamy","clay loam"]),
         "irrigation_need": "irrigated", "temp_min_c": 8.0, "temp_max_c": 28.0,
         "rainfall_min_mm": 300, "rainfall_max_mm": 600, "rust_resistant": 1,
         "traits_notes": "Heat tolerant; suitable for late sowing",
         "msp_eligible": 1, "seed_cost_band": "low", "seed_availability": "NSC",
         "data_source": "ICAR_IARI", "source_url": "https://www.iari.res.in/wheat", "crop_id": wheat_id},
        {"variety_name": "PBW-343",   "aka": None,           "release_year": 1995, "notified_by": "PAU Ludhiana",
         "maturity_days_min": 120, "maturity_days_max": 130, "yield_potential_qha": 52.0, "avg_yield_qha": 45.0,
         "sow_doy_start": 283, "sow_doy_end": 325, "sow_month_start": "October", "sow_month_end": "November",
         "soil_ph_min": 6.0, "soil_ph_max": 8.0, "soil_types": json.dumps(["loamy","sandy loam"]),
         "irrigation_need": "irrigated", "temp_min_c": 8.0, "temp_max_c": 26.0,
         "rainfall_min_mm": 250, "rainfall_max_mm": 500, "rust_resistant": 1,
         "traits_notes": "Widely adapted in NW plains; semi-dwarf",
         "msp_eligible": 1, "seed_cost_band": "low", "seed_availability": "both",
         "data_source": "PAU_Ludhiana", "crop_id": wheat_id},
        {"variety_name": "GW-496",    "aka": None,           "release_year": 2007, "notified_by": "SDAU Gujarat",
         "maturity_days_min": 105, "maturity_days_max": 112, "yield_potential_qha": 46.0, "avg_yield_qha": 38.0,
         "sow_doy_start": 299, "sow_doy_end": 340, "sow_month_start": "October", "sow_month_end": "December",
         "soil_ph_min": 6.5, "soil_ph_max": 8.2, "soil_types": json.dumps(["black cotton","medium loam"]),
         "irrigation_need": "irrigated", "temp_min_c": 12.0, "temp_max_c": 32.0,
         "rainfall_min_mm": 200, "rainfall_max_mm": 450, "rust_resistant": 0,
         "traits_notes": "Heat tolerant; suited for Gujarat & Rajasthan",
         "msp_eligible": 1, "seed_cost_band": "low", "seed_availability": "both",
         "data_source": "SDAU", "crop_id": wheat_id},
    ]
    for v in wheat_varieties:
        vid = insert_variety(conn, v)
        if vid:
            if v["variety_name"] in ("HD-2967", "HD-3086", "PBW-343"):
                link_zones(conn, vid, ["NW", "NE"], "excellent")
                link_zones(conn, vid, ["C"], "good")
                link_states(conn, vid, ["Punjab", "Haryana", "Uttar Pradesh", "Bihar", "Madhya Pradesh"])
            else:
                link_zones(conn, vid, ["WC", "P"], "excellent")
                link_states(conn, vid, ["Gujarat", "Rajasthan", "Maharashtra"])
    print(f"  ✓ {len(wheat_varieties)} wheat varieties loaded")
    # ── Rice ─────────────────────────────────────────────────────────────────
    rice_id = upsert_crop(conn, "rice", "चावल", "cereal", "kharif")
    rice_varieties = [
        {"variety_name": "Swarna (MTU-7029)", "aka": "Swarna", "release_year": 1982, "notified_by": "ANGRAU",
         "maturity_days_min": 145, "maturity_days_max": 155, "yield_potential_qha": 52.0, "avg_yield_qha": 42.0,
         "sow_doy_start": 152, "sow_doy_end": 196, "sow_month_start": "June", "sow_month_end": "July",
         "soil_ph_min": 5.5, "soil_ph_max": 7.0, "soil_types": json.dumps(["clay","clay loam","silty clay"]),
         "irrigation_need": "irrigated", "drought_tolerant": 0, "temp_min_c": 22.0, "temp_max_c": 35.0,
         "rainfall_min_mm": 1200, "rainfall_max_mm": 2000, "blast_resistant": 0,
         "traits_notes": "Widely grown; poor drought tolerance",
         "msp_eligible": 1, "seed_cost_band": "low", "seed_availability": "both",
         "data_source": "ICAR_IARI", "crop_id": rice_id},
        {"variety_name": "IR-64", "aka": "IR 64", "release_year": 1985, "notified_by": "IRRI / India",
         "maturity_days_min": 110, "maturity_days_max": 120, "yield_potential_qha": 50.0, "avg_yield_qha": 40.0,
         "sow_doy_start": 152, "sow_doy_end": 213, "sow_month_start": "June", "sow_month_end": "July",
         "soil_ph_min": 5.0, "soil_ph_max": 7.5, "soil_types": json.dumps(["clay","loamy","silty"]),
         "irrigation_need": "both", "drought_tolerant": 0, "temp_min_c": 22.0, "temp_max_c": 36.0,
         "rainfall_min_mm": 1000, "rainfall_max_mm": 2000, "blast_resistant": 1,
         "traits_notes": "Medium duration; widely adapted",
         "msp_eligible": 1, "seed_cost_band": "low", "seed_availability": "both",
         "data_source": "ICAR_IARI", "crop_id": rice_id},
        {"variety_name": "Sahbhagi Dhan", "aka": "DRR Dhan 42", "release_year": 2010, "notified_by": "ICAR-CRRI",
         "maturity_days_min": 100, "maturity_days_max": 110, "yield_potential_qha": 40.0, "avg_yield_qha": 32.0,
         "sow_doy_start": 152, "sow_doy_end": 196, "sow_month_start": "June", "sow_month_end": "July",
         "soil_ph_min": 5.5, "soil_ph_max": 7.0, "soil_types": json.dumps(["upland loamy","laterite"]),
         "irrigation_need": "rainfed", "drought_tolerant": 1, "water_stress_tol": 1,
         "temp_min_c": 24.0, "temp_max_c": 38.0, "rainfall_min_mm": 800, "rainfall_max_mm": 1400,
         "blast_resistant": 1, "traits_notes": "Drought tolerant; rainfed upland",
         "msp_eligible": 1, "seed_cost_band": "medium", "seed_availability": "NSC",
         "data_source": "ICAR_CRRI", "source_url": "https://www.crri.res.in", "crop_id": rice_id},
        {"variety_name": "Pusa Basmati 1121", "aka": "PB 1121", "release_year": 2003, "notified_by": "ICAR-IARI",
         "maturity_days_min": 140, "maturity_days_max": 150, "yield_potential_qha": 45.0, "avg_yield_qha": 37.0,
         "sow_doy_start": 152, "sow_doy_end": 182, "sow_month_start": "June", "sow_month_end": "June",
         "soil_ph_min": 6.5, "soil_ph_max": 7.5, "soil_types": json.dumps(["loamy","sandy loam"]),
         "irrigation_need": "irrigated", "temp_min_c": 22.0, "temp_max_c": 34.0,
         "rainfall_min_mm": 900, "rainfall_max_mm": 1400, "blast_resistant": 0,
         "traits_notes": "Extra-long grain; premium export; aromatic", "export_quality": 1,
         "msp_eligible": 1, "seed_cost_band": "medium", "seed_availability": "private",
         "data_source": "ICAR_IARI", "crop_id": rice_id},
    ]
    for v in rice_varieties:
        vid = insert_variety(conn, v)
        if vid:
            if "Swarna" in v["variety_name"] or "IR-64" in v["variety_name"]:
                link_zones(conn, vid, ["NE", "P", "S"], "excellent")
                link_zones(conn, vid, ["C"], "good")
                link_states(conn, vid, ["West Bengal", "Odisha", "Andhra Pradesh", "Telangana", "Tamil Nadu", "Bihar"])
            elif "Sahbhagi" in v["variety_name"]:
                link_zones(conn, vid, ["NE", "C"], "excellent")
                link_states(conn, vid, ["Jharkhand", "Chhattisgarh", "Odisha", "Bihar"])
            else:
                link_zones(conn, vid, ["NW"], "excellent")
                link_states(conn, vid, ["Punjab", "Haryana", "Uttar Pradesh", "Uttarakhand"])
    print(f"  ✓ {len(rice_varieties)} rice varieties loaded")
    # ── Soybean ───────────────────────────────────────────────────────────────
    soy_id = upsert_crop(conn, "soybean", "सोयाबीन", "oilseed", "kharif")
    soy_varieties = [
        {"variety_name": "JS-335", "aka": "Samrat", "release_year": 1994, "notified_by": "JNKVV / ICAR-NRCS",
         "maturity_days_min": 90, "maturity_days_max": 100, "yield_potential_qha": 35.0, "avg_yield_qha": 25.0,
         "sow_doy_start": 152, "sow_doy_end": 182, "sow_month_start": "June", "sow_month_end": "June",
         "soil_ph_min": 6.0, "soil_ph_max": 7.5, "soil_types": json.dumps(["black cotton","medium loam"]),
         "irrigation_need": "rainfed", "drought_tolerant": 0, "temp_min_c": 25.0, "temp_max_c": 38.0,
         "rainfall_min_mm": 700, "rainfall_max_mm": 1200,
         "traits_notes": "Most widely grown soybean in India; semi-determinate",
         "msp_eligible": 1, "seed_cost_band": "low", "seed_availability": "both",
         "data_source": "ICAR_NRCS", "crop_id": soy_id},
        {"variety_name": "NRC-37", "aka": None, "release_year": 2003, "notified_by": "ICAR-NRCS Indore",
         "maturity_days_min": 88, "maturity_days_max": 95, "yield_potential_qha": 32.0, "avg_yield_qha": 24.0,
         "sow_doy_start": 152, "sow_doy_end": 189, "sow_month_start": "June", "sow_month_end": "July",
         "soil_ph_min": 6.0, "soil_ph_max": 7.8, "soil_types": json.dumps(["black cotton","clay loam"]),
         "irrigation_need": "rainfed", "drought_tolerant": 1, "temp_min_c": 24.0, "temp_max_c": 40.0,
         "rainfall_min_mm": 650, "rainfall_max_mm": 1100,
         "traits_notes": "Drought tolerant; high oil content (~20%)",
         "msp_eligible": 1, "seed_cost_band": "low", "seed_availability": "NSC",
         "data_source": "ICAR_NRCS", "crop_id": soy_id},
    ]
    for v in soy_varieties:
        vid = insert_variety(conn, v)
        if vid:
            link_zones(conn, vid, ["C", "P"], "excellent")
            link_states(conn, vid, ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Chhattisgarh"])
    print(f"  ✓ {len(soy_varieties)} soybean varieties loaded")
    # ── Chickpea ──────────────────────────────────────────────────────────────
    chana_id = upsert_crop(conn, "chickpea", "चना", "pulse", "rabi")
    chana_varieties = [
        {"variety_name": "JG-11", "aka": "Kranthi", "release_year": 2005, "notified_by": "ICRISAT / JNKVV",
         "maturity_days_min": 85, "maturity_days_max": 95, "yield_potential_qha": 25.0, "avg_yield_qha": 18.0,
         "sow_doy_start": 288, "sow_doy_end": 320, "sow_month_start": "October", "sow_month_end": "November",
         "soil_ph_min": 6.0, "soil_ph_max": 8.0, "soil_types": json.dumps(["black cotton","medium loam","sandy loam"]),
         "irrigation_need": "rainfed", "drought_tolerant": 1, "temp_min_c": 15.0, "temp_max_c": 30.0,
         "rainfall_min_mm": 400, "rainfall_max_mm": 900,
         "traits_notes": "Wilt resistant; short duration desi type",
         "msp_eligible": 1, "seed_cost_band": "low", "seed_availability": "both",
         "data_source": "ICRISAT", "crop_id": chana_id},
        {"variety_name": "Vihar (JAKI-9218)", "aka": "JAKI-9218", "release_year": 2001, "notified_by": "ICAR-IIPR",
         "maturity_days_min": 105, "maturity_days_max": 115, "yield_potential_qha": 28.0, "avg_yield_qha": 20.0,
         "sow_doy_start": 288, "sow_doy_end": 325, "sow_month_start": "October", "sow_month_end": "November",
         "soil_ph_min": 6.5, "soil_ph_max": 8.0, "soil_types": json.dumps(["black cotton","clay loam"]),
         "irrigation_need": "both", "temp_min_c": 12.0, "temp_max_c": 28.0,
         "rainfall_min_mm": 500, "rainfall_max_mm": 1000,
         "traits_notes": "High yielding desi; Botrytis grey mould tolerant",
         "msp_eligible": 1, "seed_cost_band": "low", "seed_availability": "NSC",
         "data_source": "ICAR_IIPR", "crop_id": chana_id},
    ]
    for v in chana_varieties:
        vid = insert_variety(conn, v)
        if vid:
            link_zones(conn, vid, ["C", "P", "NW"], "excellent")
            link_states(conn, vid, ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Andhra Pradesh", "Karnataka"])
    print(f"  ✓ {len(chana_varieties)} chickpea varieties loaded")
    total = conn.execute("SELECT COUNT(*) FROM varieties").fetchone()[0]
    print(f"\n  ✅ Seed complete: {total} varieties across {conn.execute('SELECT COUNT(*) FROM crops').fetchone()[0]} crops\n")
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["static", "all"], default="static")
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()
    if args.reset:
        DB_PATH.unlink(missing_ok=True)
        print("✓ Database reset")
    conn = get_conn()
    init_db(conn)
    seed_static_data(conn)
    print("\n── Summary ──")
    for row in conn.execute("SELECT c.crop_name, COUNT(v.variety_id) as n FROM crops c LEFT JOIN varieties v ON v.crop_id = c.crop_id GROUP BY c.crop_name"):
        print(f"  {row[0]:20s} {row[1]} varieties")
    conn.close()
    print(f"\n✅ DB at {DB_PATH.resolve()}")