"""
KrishiMitra — Council of Models Router
=======================================
POST /council — Single endpoint that fans out to every available model,
catches errors per-model so one failure never crashes the response, and
returns a unified JSON with each model's output under its own key.

Models:
  1. crop_recommender   — XGBoost classifier  (N,P,K,temp,hum,ph,rain)
  2. fertilizer         — RF classifier       (temp,hum,moisture,soil,crop,N,K,P + encoders/scaler)
  3. soil_health        — RF regressor         (N,P,K,temp,hum,ph,rain)
  4. yield_predictor    — RF regressor         (N,P,K,temp,hum,ph,rain,crop_encoded)
  5. irrigation         — RF regressor         (N,P,K,temp,hum,ph,rain,crop_encoded)
  6. growth_stage       — Keras CNN            (field_image_base64 → class name)
  7. pest_identifier    — Keras CNN            (leaf_image_base64 → class name)
"""
import base64
import io
import json
import math
import logging
import os
from typing import Any, Optional

import httpx
import numpy as np
import pandas as pd
import asyncio
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from utils.india_data import fetch_live_indian_mandi_prices

load_dotenv()

logger = logging.getLogger("krishimitra.council")

SYNTHESIS_SYSTEM_PROMPT = (
    "You are the KrishiMitra expert farm advisory synthesizer. "
    "You receive outputs from multiple specialist ML models and live weather telemetry "
    "about a farmer's situation and produce a unified, actionable recommendation. "
    "Resolve conflicts between model outputs, prioritize the 3 most urgent actions, "
    "flag warnings prominently, and end with one practical follow-up question. "
    "Keep advice localized, multilingual, and strictly under 280 words."
)

router = APIRouter()

# ---------------------------------------------------------------------------
# Lazy import of model_registry (avoids circular imports at module level)
# ---------------------------------------------------------------------------

def _reg():
    """Return the model_registry module (imported once, cached by Python)."""
    import model_registry  # noqa: E402
    return model_registry


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class CouncilRequest(BaseModel):
    N: float = Field(..., description="Nitrogen content")
    P: float = Field(..., description="Phosphorus content")
    K: float = Field(..., description="Potassium content")
    temperature: float = Field(..., description="Temperature °C")
    humidity: float = Field(..., description="Humidity %")
    ph: float = Field(..., description="Soil pH")
    rainfall: float = Field(..., description="Rainfall mm")
    crop: Optional[str] = Field(None, description="Crop name (e.g. rice, maize)")
    leaf_image_base64: Optional[str] = Field(
        None, description="Base64-encoded leaf image for pest identifier"
    )
    field_image_base64: Optional[str] = Field(
        None, description="Base64-encoded field image for growth stage model"
    )


class SynthesizeRequest(CouncilRequest):
    question: str = Field(..., description="The farmer's question in their own words")


class SynthesizeResponse(BaseModel):
    council_outputs: dict[str, Any]
    synthesis: Optional[str] = None
    weather_snapshot: Optional[dict[str, Any]] = None
    mandi_snapshot: Optional[dict[str, Any]] = None
    error: bool = False
    error_message: Optional[str] = None


# ---------------------------------------------------------------------------
# Reference data (matches train_council.py)
# ---------------------------------------------------------------------------

BASE_YIELDS = {
    'rice': 4.5, 'maize': 5.2, 'chickpea': 1.8, 'kidneybeans': 2.0,
    'pigeonpeas': 1.5, 'mothbeans': 1.1, 'mungbean': 1.2, 'blackgram': 1.0,
    'lentil': 1.1, 'pomegranate': 18.0, 'banana': 35.0, 'mango': 12.0,
    'grapes': 8.0, 'watermelon': 25.0, 'muskmelon': 15.0, 'apple': 20.0,
    'orange': 14.0, 'papaya': 30.0, 'coconut': 14.0, 'cotton': 2.1,
    'jute': 2.5, 'coffee': 1.2,
}

WATER_REQ = {
    'rice': 1200, 'maize': 600, 'cotton': 700, 'chickpea': 350,
    'kidneybeans': 400, 'pigeonpeas': 450, 'mothbeans': 300, 'mungbean': 400,
    'blackgram': 380, 'lentil': 350, 'pomegranate': 600, 'banana': 1800,
    'mango': 900, 'grapes': 700, 'watermelon': 500, 'muskmelon': 450,
    'apple': 800, 'orange': 750, 'papaya': 1100, 'coconut': 1500,
    'jute': 500, 'coffee': 1200,
}


# ---------------------------------------------------------------------------
# Image helpers
# ---------------------------------------------------------------------------

def _decode_image(b64: str, target_size: tuple) -> np.ndarray:
    """
    Decode a base64 image string, resize to *target_size*, normalise
    pixel values to [0, 1], and return a batch-ready (1, H, W, 3) array.
    """
    from PIL import Image  # lazy so startup stays fast

    raw = base64.b64decode(b64)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    img = img.resize(target_size, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)  # (1, H, W, 3)


# ---------------------------------------------------------------------------
# Per-model prediction functions
# ---------------------------------------------------------------------------

def _predict_crop_recommender(req: CouncilRequest) -> dict:
    """XGBoost crop classifier — needs only the 7 numeric soil/climate features."""
    reg = _reg()
    model = reg.get("crop_recommender_model.pkl")
    le = reg.get("label_encoder.pkl")

    features = np.array([[req.N, req.P, req.K,
                          req.temperature, req.humidity,
                          req.ph, req.rainfall]])
    pred = model.predict(features)[0]
    crop_name = le.inverse_transform([int(pred)])[0]

    # Probabilities (if available)
    proba = {}
    if hasattr(model, "predict_proba"):
        raw_proba = model.predict_proba(features)[0]
        for cls, p in zip(le.classes_, raw_proba):
            proba[cls] = round(float(p), 4)

    return {
        "recommended_crop": crop_name,
        "probabilities": proba,
    }


def _predict_fertilizer(req: CouncilRequest) -> dict:
    """
    Fertilizer recommender — needs soil_type, crop_type, moisture plus the
    shared numeric fields. Because those extra inputs are not part of the
    council request schema we use sensible defaults when absent.
    """
    reg = _reg()
    model = reg.get("fertilizer_model.pkl")
    encoders = reg.get("fertilizer_feature_encoders.pkl")
    scaler = reg.get("fertilizer_scaler.pkl")

    # Build a single-row DataFrame matching the training schema.
    # Council input provides N,P,K as Nitrogen/Phosphorous/Potassium, plus
    # temperature and humidity.  Moisture, Soil Type and Crop Type are not in
    # the council schema, so we use reasonable defaults.
    input_data = pd.DataFrame([{
        "Temparature": req.temperature,        # NOTE: original dataset spelling
        "Humidity": req.humidity,
        "Moisture": req.humidity * 0.6,         # proxy when not supplied
        "Soil Type": "Loamy",                   # safe default
        "Crop Type": (req.crop.capitalize() if req.crop else "Maize"),
        "Nitrogen": req.N,
        "Potassium": req.K,
        "Phosphorous": req.P,
    }])

    num_cols = ["Temparature", "Humidity", "Moisture",
                "Nitrogen", "Potassium", "Phosphorous"]
    cat_cols = ["Soil Type", "Crop Type"]

    for col in cat_cols:
        try:
            input_data[col] = encoders[col].transform(
                input_data[col].astype(str)
            )
        except (ValueError, KeyError):
            # Unknown category — fall back to first known class
            input_data[col] = 0

    input_data[num_cols] = scaler.transform(input_data[num_cols])

    feature_cols = num_cols + cat_cols
    X = input_data[feature_cols].values
    pred_encoded = model.predict(X)[0]
    proba = model.predict_proba(X)[0]

    fertilizer_name = encoders["__target__"].inverse_transform([pred_encoded])[0]
    confidence = float(np.max(proba))
    class_names = list(encoders["__target__"].classes_)
    prob_dict = {name: round(float(p), 4) for name, p in zip(class_names, proba)}

    return {
        "recommended_fertilizer": fertilizer_name,
        "confidence": round(confidence, 4),
        "probabilities": prob_dict,
    }


def _predict_soil_health(req: CouncilRequest) -> dict:
    """Soil health regression (0-100 score)."""
    reg = _reg()
    model = reg.get("soil_health_model.pkl")

    features = pd.DataFrame([{
        "N": req.N, "P": req.P, "K": req.K,
        "temperature": req.temperature, "humidity": req.humidity,
        "ph": req.ph, "rainfall": req.rainfall,
    }])
    score = float(model.predict(features)[0])
    score = max(0.0, min(100.0, score))

    if score >= 85:
        grade = "Excellent"
    elif score >= 70:
        grade = "Good"
    elif score >= 55:
        grade = "Moderate"
    else:
        grade = "Poor"

    issues = []
    if req.N < 40:
        issues.append("Nitrogen low")
    elif req.N > 100:
        issues.append("Nitrogen high")
    if req.P < 15:
        issues.append("Phosphorus low")
    if req.K < 10:
        issues.append("Potassium low")
    if req.ph < 6.0:
        issues.append("Soil acidic")
    elif req.ph > 7.5:
        issues.append("Soil alkaline")

    return {
        "score": round(score, 2),
        "grade": grade,
        "issues": issues,
    }


def _predict_yield(req: CouncilRequest) -> dict:
    """Yield predictor — requires crop name."""
    reg = _reg()
    model = reg.get("yield_predictor_model.pkl")
    le = reg.get("yield_label_encoder.pkl")

    crop_clean = (req.crop or "rice").lower().strip()
    if crop_clean not in le.classes_:
        crop_clean = "rice"

    crop_encoded = int(le.transform([crop_clean])[0])

    features = pd.DataFrame([{
        "N": req.N, "P": req.P, "K": req.K,
        "temperature": req.temperature, "humidity": req.humidity,
        "ph": req.ph, "rainfall": req.rainfall,
        "crop": crop_encoded,
    }])

    estimated = float(model.predict(features)[0])
    potential = BASE_YIELDS.get(crop_clean, 2.0) * 1.155
    gap_pct = max(0.0, ((potential - estimated) / potential) * 100)

    limiting = []
    if req.N <= 60:
        limiting.append("Nitrogen deficiency")
    if req.rainfall <= 100:
        limiting.append("Insufficient rainfall")
    if not (18 <= req.temperature <= 32):
        limiting.append("Sub-optimal temperature")

    return {
        "crop": crop_clean,
        "estimated_yield_ton_per_ha": round(estimated, 2),
        "potential_yield_ton_per_ha": round(potential, 2),
        "yield_gap_percent": round(gap_pct, 2),
        "limiting_factors": limiting if limiting else ["None"],
    }


def _predict_irrigation(req: CouncilRequest) -> dict:
    """Irrigation deficit predictor — requires crop name."""
    reg = _reg()
    model = reg.get("irrigation_model.pkl")
    le = reg.get("yield_label_encoder.pkl")  # shared encoder

    crop_clean = (req.crop or "rice").lower().strip()
    if crop_clean not in le.classes_:
        crop_clean = "rice"

    crop_encoded = int(le.transform([crop_clean])[0])

    features = pd.DataFrame([{
        "N": req.N, "P": req.P, "K": req.K,
        "temperature": req.temperature, "humidity": req.humidity,
        "ph": req.ph, "rainfall": req.rainfall,
        "crop": crop_encoded,
    }])

    deficit = max(0.0, float(model.predict(features)[0]))
    seasonal_req = WATER_REQ.get(crop_clean, 500)
    coverage = float(min(seasonal_req, req.rainfall))
    irrigations = int(math.ceil(deficit / 50)) if deficit > 0 else 0

    if req.humidity < 60:
        next_action = "Irrigate within 2 days"
    elif req.humidity < 75:
        next_action = "Irrigate within 5-7 days"
    else:
        next_action = "Irrigation not needed"

    return {
        "crop": crop_clean,
        "seasonal_water_req_mm": seasonal_req,
        "rainfall_coverage_mm": round(coverage, 2),
        "irrigation_deficit_mm": round(deficit, 2),
        "irrigations_per_season": irrigations,
        "next_action": next_action,
    }


def _predict_growth_stage(req: CouncilRequest) -> dict:
    """
    Keras CNN — classifies crop growth stage from a field photograph.
    Requires field_image_base64.
    """
    if not req.field_image_base64:
        return {"skipped": True, "reason": "field_image_base64 not provided"}

    reg = _reg()
    model = reg.get("growth_stage_model.h5")
    index_map = reg.get("growth_stage_index.json")    # {index: class_name}
    classes = reg.get("growth_stage_classes.json")     # list or dict

    # Determine expected input size from the model's input shape
    input_shape = model.input_shape  # e.g. (None, 224, 224, 3)
    h, w = input_shape[1], input_shape[2]

    img = _decode_image(req.field_image_base64, (w, h))
    preds = model.predict(img, verbose=0)[0]

    # Map index -> class name.  index_map may be {"0": "seedling", ...}
    # or classes may be ["seedling", "vegetative", ...].
    if isinstance(index_map, dict):
        label_map = {int(k): v for k, v in index_map.items()}
    elif isinstance(classes, list):
        label_map = {i: c for i, c in enumerate(classes)}
    else:
        label_map = {i: str(i) for i in range(len(preds))}

    top_idx = int(np.argmax(preds))
    confidence = float(preds[top_idx])

    return {
        "predicted_stage": label_map.get(top_idx, str(top_idx)),
        "confidence": round(confidence, 4),
        "all_stages": {
            label_map.get(i, str(i)): round(float(p), 4)
            for i, p in enumerate(preds)
        },
    }


def _predict_pest(req: CouncilRequest) -> dict:
    """
    Keras CNN — classifies pest / disease from a leaf photograph.
    Requires leaf_image_base64.  Input resized to 224x224.
    """
    if not req.leaf_image_base64:
        return {"skipped": True, "reason": "leaf_image_base64 not provided"}

    reg = _reg()
    model = reg.get("pest_identifier_model.h5")
    classes = reg.get("pest_classes.json")  # list or dict

    img = _decode_image(req.leaf_image_base64, (224, 224))
    preds = model.predict(img, verbose=0)[0]

    if isinstance(classes, list):
        label_map = {i: c for i, c in enumerate(classes)}
    elif isinstance(classes, dict):
        label_map = {int(k): v for k, v in classes.items()}
    else:
        label_map = {i: str(i) for i in range(len(preds))}

    top_idx = int(np.argmax(preds))
    confidence = float(preds[top_idx])

    return {
        "predicted_pest": label_map.get(top_idx, str(top_idx)),
        "confidence": round(confidence, 4),
        "all_classes": {
            label_map.get(i, str(i)): round(float(p), 4)
            for i, p in enumerate(preds)
        },
    }


# ---------------------------------------------------------------------------
# Registry of all models and which inputs they need
# ---------------------------------------------------------------------------

_MODEL_RUNNERS = [
    # (output_key, callable, list of required model files on disk)
    ("crop_recommender", _predict_crop_recommender,
     ["crop_recommender_model.pkl", "label_encoder.pkl"]),
    ("fertilizer", _predict_fertilizer,
     ["fertilizer_model.pkl", "fertilizer_feature_encoders.pkl", "fertilizer_scaler.pkl"]),
    ("soil_health", _predict_soil_health,
     ["soil_health_model.pkl"]),
    ("yield_predictor", _predict_yield,
     ["yield_predictor_model.pkl", "yield_label_encoder.pkl"]),
    ("irrigation", _predict_irrigation,
     ["irrigation_model.pkl", "yield_label_encoder.pkl"]),
    ("growth_stage", _predict_growth_stage,
     ["growth_stage_model.h5", "growth_stage_index.json", "growth_stage_classes.json"]),
    ("pest_identifier", _predict_pest,
     ["pest_identifier_model.h5", "pest_classes.json"]),
]


# ---------------------------------------------------------------------------
# Council execution & synthesis helpers
# ---------------------------------------------------------------------------

def execute_council(req: CouncilRequest) -> dict[str, Any]:
    """
    Run every model whose required artifacts exist on disk.
    Each model is isolated: one failure populates an ``error`` key but does
    not prevent the remaining models from running.
    """
    reg = _reg()
    results = {}

    for key, fn, required_files in _MODEL_RUNNERS:
        if not all(reg.is_available(f) for f in required_files):
            results[key] = {
                "skipped": True,
                "reason": "Model file(s) not found on disk",
                "missing": [f for f in required_files if not reg.is_available(f)],
            }
            continue

        try:
            results[key] = fn(req)
        except Exception as exc:
            logger.exception("Council model '%s' failed", key)
            results[key] = {"error": str(exc)}

    return results


def build_council_context(council_outputs: dict[str, Any], question: str) -> str:
    """Assemble a structured text block listing every model output."""
    sections = [f"FARMER'S QUESTION:\n{question}\n"]
    for model_name, output in council_outputs.items():
        label = model_name.replace("_", " ").upper()
        body = json.dumps(output, indent=2, ensure_ascii=False)
        sections.append(f"=== {label} ===\n{body}")
    return "\n\n".join(sections)


async def fetch_weather_snapshot() -> dict:
    """Fetch live weather from Open-Meteo; fall back to sensible defaults."""
    async with httpx.AsyncClient() as client:
        try:
            weather_url = (
                "https://api.open-meteo.com/v1/forecast"
                "?latitude=18.5204&longitude=73.8567&current_weather=true"
            )
            weather_res = await client.get(weather_url, timeout=4.0)
            return weather_res.json().get("current_weather", {})
        except Exception:
            return {"temperature": 27.5, "windspeed": 12.0, "weathercode": 1}


async def call_gemini_synthesis(
    context: str,
    weather_snapshot: dict,
    mandi_snapshot: dict,
    req: SynthesizeRequest,
) -> str:
    """Call Google Gemini to synthesize council outputs into a unified recommendation."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is not set")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash:generateContent?key={api_key}"
    )

    records = mandi_snapshot.get("records", [])
    mandi_info = ", ".join([
        f"{r.get('market', 'Market')} ({r.get('variety', 'Standard')}): {r.get('modal_price', 'N/A')} INR/quintal"
        for r in records[:3]
    ]) if records else "No live mandi rates available."

    user_text = (
        f"{context}\n\n"
        f"Current Soil Status: N={req.N}, P={req.P}, K={req.K}, pH={req.ph}. "
        f"Live Weather Conditions: Temperature={weather_snapshot.get('temperature')}°C, "
        f"Windspeed={weather_snapshot.get('windspeed')}km/h. "
        f"Live Mandi Wholesale Rates ({mandi_snapshot.get('commodity', 'Wheat')}): {mandi_info}. "
        f"User Question: {req.question}\n\n"
        "Based on the specialist model outputs above, the live weather, the live mandi rates, "
        "and the farmer's question, provide your unified advisory recommendation."
    )

    payload = {
        "system_instruction": {
            "parts": [{"text": SYNTHESIS_SYSTEM_PROMPT}]
        },
        "contents": [
            {"role": "user", "parts": [{"text": user_text}]}
        ],
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, timeout=60.0)

    if response.status_code != 200:
        raise RuntimeError(
            f"Gemini API returned {response.status_code}: {response.text}"
        )

    return response.json()["candidates"][0]["content"]["parts"][0]["text"]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/")
async def run_council(req: CouncilRequest):
    """Run all council specialist models and return structured outputs."""
    try:
        return execute_council(req)
    except Exception as exc:
        logger.exception("Council execution failed")
        raise HTTPException(
            status_code=500, detail=f"Council execution error: {exc}"
        ) from exc


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_council_advisory(req: SynthesizeRequest):
    """
    Run all council models, fetch live weather telemetry, then synthesize
    a unified recommendation via Google Gemini.
    Returns council_outputs and snapshots even when synthesis fails.
    """
    # 1. Fetch live weather & mandi telemetry concurrently (non-blocking, with fallback)
    commodity = req.crop or "Wheat"
    state = "Maharashtra"
    
    weather_task = fetch_weather_snapshot()
    mandi_task = fetch_live_indian_mandi_prices(commodity, state)
    weather_snapshot, mandi_snapshot = await asyncio.gather(weather_task, mandi_task)

    # 2. Run council models
    try:
        council_outputs = execute_council(req)
    except Exception as exc:
        logger.exception("Council model execution failed during synthesis")
        raise HTTPException(
            status_code=500, detail=f"Council execution error: {exc}"
        ) from exc

    context = build_council_context(council_outputs, req.question)

    # 3. Synthesize via Gemini with live weather and mandi context
    try:
        synthesis = await call_gemini_synthesis(context, weather_snapshot, mandi_snapshot, req)
        return SynthesizeResponse(
            council_outputs=council_outputs,
            synthesis=synthesis,
            weather_snapshot=weather_snapshot,
            mandi_snapshot=mandi_snapshot,
            error=False,
        )
    except Exception as exc:
        logger.error("Gemini synthesis failed: %s", exc, exc_info=True)
        return SynthesizeResponse(
            council_outputs=council_outputs,
            synthesis=None,
            weather_snapshot=weather_snapshot,
            mandi_snapshot=mandi_snapshot,
            error=True,
            error_message=str(exc),
        )
