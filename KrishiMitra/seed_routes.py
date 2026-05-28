"""
KrishiMitra — Seed Variety API Routes
Mount in main.py with:
    from seed_routes import router as seed_router
    app.include_router(seed_router, prefix="/seeds", tags=["Seed Varieties"])
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import sqlite3
import json
from pathlib import Path
from datetime import datetime
router = APIRouter()
DB_PATH = Path("data/seed_db/varieties.db")
def get_conn():
    if not DB_PATH.exists():
        raise HTTPException(status_code=503,
            detail="Seed DB not found. Run: python ingest_seeds.py --mode static")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
def row_to_dict(row):
    d = dict(row)
    for field in ("soil_types",):
        if d.get(field):
            try:
                d[field] = json.loads(d[field])
            except Exception:
                pass
    return d
def doy_from_date(date_str):
    if not date_str:
        return None
    try:
        if len(date_str) == 10:
            return datetime.strptime(date_str, "%Y-%m-%d").timetuple().tm_yday
        if len(date_str) == 5:
            return datetime.strptime(f"2000-{date_str}", "%Y-%m-%d").timetuple().tm_yday
    except Exception:
        pass
    return None
class FullRecommendation(BaseModel):
    crop_name: str
    state: Optional[str] = None
    soil_ph: Optional[float] = None
    rainfall_mm: Optional[float] = None
    irrigation: Optional[str] = None
@router.get("/crops")
def list_crops():
    conn = get_conn()
    rows = conn.execute(
        "SELECT crop_name, crop_name_hi, category, season FROM crops ORDER BY crop_name"
    ).fetchall()
    return {"crops": [dict(r) for r in rows]}
@router.get("/{crop_name}")
def get_varieties(
    crop_name: str,
    state: Optional[str] = Query(None),
    sow_date: Optional[str] = Query(None, description="MM-DD or YYYY-MM-DD"),
    irrigation: Optional[str] = Query(None),
    drought_tolerant: Optional[bool] = Query(None),
    limit: int = Query(5, le=20),
):
    conn = get_conn()
    sow_doy = doy_from_date(sow_date)
    sql = """
        SELECT v.*, c.crop_name, c.season
        FROM varieties v
        JOIN crops c ON c.crop_id = v.crop_id
        WHERE LOWER(c.crop_name) = LOWER(?)
    """
    params = [crop_name]
    if state:
        sql += " AND v.variety_id IN (SELECT variety_id FROM variety_states WHERE state_name LIKE ?)"
        params.append(f"%{state}%")
    if sow_doy:
        sql += " AND v.sow_doy_start <= ? AND v.sow_doy_end >= ?"
        params.extend([sow_doy, sow_doy])
    if irrigation:
        sql += " AND (v.irrigation_need = ? OR v.irrigation_need = 'both')"
        params.append(irrigation)
    if drought_tolerant is True:
        sql += " AND v.drought_tolerant = 1"
    sql += " ORDER BY v.avg_yield_qha DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(sql, params).fetchall()
    if not rows:
        raise HTTPException(status_code=404,
            detail=f"No varieties for '{crop_name}' with given filters. Try GET /seeds/crops")
    varieties = [row_to_dict(r) for r in rows]
    for v in varieties:
        v["zones"] = [dict(z) for z in conn.execute("""
            SELECT az.zone_code, az.zone_name, vz.performance
            FROM variety_zones vz JOIN agro_zones az ON az.zone_id = vz.zone_id
            WHERE vz.variety_id = ?
        """, (v["variety_id"],)).fetchall()]
    return {"crop": crop_name, "count": len(varieties), "varieties": varieties}
@router.post("/recommend")
def full_recommendation(query: FullRecommendation):
    """
    Fusion endpoint: given a predicted crop + farmer context,
    return ranked variety recommendations with sowing window.
    Call this AFTER /predict returns a crop name.
    """
    conn = get_conn()
    sql = """
        SELECT v.*, c.crop_name
        FROM varieties v JOIN crops c ON c.crop_id = v.crop_id
        WHERE LOWER(c.crop_name) = LOWER(?)
    """
    params = [query.crop_name]
    if query.state:
        sql += " AND v.variety_id IN (SELECT variety_id FROM variety_states WHERE state_name LIKE ?)"
        params.append(f"%{query.state}%")
    if query.irrigation:
        sql += " AND (v.irrigation_need = ? OR v.irrigation_need = 'both')"
        params.append(query.irrigation)
    if query.soil_ph:
        sql += " AND (v.soil_ph_min IS NULL OR v.soil_ph_min <= ?) AND (v.soil_ph_max IS NULL OR v.soil_ph_max >= ?)"
        params.extend([query.soil_ph, query.soil_ph])
    if query.rainfall_mm:
        sql += " AND (v.rainfall_min_mm IS NULL OR v.rainfall_min_mm <= ?) AND (v.rainfall_max_mm IS NULL OR v.rainfall_max_mm >= ?)"
        params.extend([query.rainfall_mm, query.rainfall_mm])
    sql += " ORDER BY v.avg_yield_qha DESC LIMIT 3"
    rows = conn.execute(sql, params).fetchall()
    cards = []
    for rank, v in enumerate([row_to_dict(r) for r in rows], 1):
        cards.append({
            "rank": rank,
            "variety_name": v["variety_name"],
            "aka": v.get("aka"),
            "avg_yield_qha": v.get("avg_yield_qha"),
            "maturity_days": f"{v.get('maturity_days_min')}–{v.get('maturity_days_max')} days",
            "sow_window": f"{v.get('sow_month_start')} – {v.get('sow_month_end')}",
            "irrigation": v.get("irrigation_need"),
            "drought_tolerant": bool(v.get("drought_tolerant")),
            "key_traits": v.get("traits_notes"),
            "seed_source": v.get("seed_availability"),
        })
    return {
        "crop": query.crop_name,
        "state": query.state,
        "top_varieties": cards,
        "next_steps": (
            f"Plant {cards[0]['variety_name']} between {cards[0]['sow_window']}. "
            f"Ask the expert chat for detailed cultivation advice."
        ) if cards else "No matching varieties found.",
    }