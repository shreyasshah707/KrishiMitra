"""
KrishiMitra — Fertilizer Planner Router
========================================
POST /planner — Accepts soil and crop data, returns a fertilizer
recommendation using the trained RandomForest model.
"""

import os
import sys

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.inference import predict_fertilizer, load_config

router = APIRouter()


class PlannerInput(BaseModel):
    """Input schema for fertilizer recommendation."""
    temperature: float = Field(..., description="Ambient temperature in °C", ge=0, le=60)     #Ignore NonFunctional Errors
    humidity: float = Field(..., description="Relative humidity (%)", ge=0, le=100)
    moisture: float = Field(..., description="Soil moisture content", ge=0, le=100)
    soil_type: str = Field(..., description="Soil type: Sandy, Loamy, Black, Red, Clayey")
    crop_type: str = Field(
        ...,
        description="Crop: Maize, Sugarcane, Cotton, Tobacco, Paddy, Barley,"
        "Wheat, Millets, Oil seeds, Pulses, Ground Nuts"
        )
    nitrogen: float = Field(..., description="Nitrogen level in soil", ge=0)
    potassium: float = Field(..., description="Potassium level in soil", ge=0)
    phosphorous: float = Field(..., description="Phosphorous level in soil", ge=0)


class PlannerOutput(BaseModel):
    """Output schema for fertilizer recommendation."""
    recommended_fertilizer: str
    confidence: float
    probabilities: dict
    dosage_advice: str
    application_schedule: list


# Dosage guidelines per fertilizer type (simplified)
DOSAGE_GUIDELINES = {
    "Urea": {
        "dosage": "Apply 100-150 kg/hectare in 2-3 split doses",
        "schedule": [
            "Day 0 (Sowing): Apply 1/3 of total dose as basal",
            "Day 21-25: Apply 1/3 as first top dressing",
            "Day 45-50: Apply remaining 1/3 as second top dressing",
        ],
    },
    "DAP": {
        "dosage": "Apply 100-125 kg/hectare as basal dose",
        "schedule": [
            "Day 0 (Sowing): Apply full dose in soil before planting",
            "Day 30: Monitor crop — supplement with Urea if yellowing observed",
        ],
    },
    "14-35-14": {
        "dosage": "Apply 150-200 kg/hectare",
        "schedule": [
            "Day 0 (Sowing): Apply 60% as basal dose",
            "Day 30: Apply 40% as top dressing",
            "Day 60: Foliar spray if nutrient deficiency persists",
        ],
    },
    "28-28": {
        "dosage": "Apply 125-175 kg/hectare in split doses",
        "schedule": [
            "Day 0 (Sowing): Apply 50% as basal",
            "Day 25-30: Apply remaining 50% as top dressing",
        ],
    },
    "17-17-17": {
        "dosage": "Apply 150-200 kg/hectare",
        "schedule": [
            "Day 0 (Sowing): Apply 50% as basal",
            "Day 20: Apply 25% as first top dressing",
            "Day 40: Apply remaining 25% as second top dressing",
        ],
    },
    "20-20": {
        "dosage": "Apply 125-150 kg/hectare",
        "schedule": [
            "Day 0 (Sowing): Apply 60% as basal dose",
            "Day 30: Apply 40% as top dressing",
        ],
    },
    "10-26-26": {
        "dosage": "Apply 150-200 kg/hectare",
        "schedule": [
            "Day 0 (Sowing): Apply full dose as basal",
            "Day 30: Supplement with Urea if nitrogen deficiency observed",
        ],
    },
}


@router.post("/", response_model=PlannerOutput)
async def get_fertilizer_plan(data: PlannerInput):
    """
    Predict the best fertilizer and return a full application plan.
    """
    try:
        config = load_config()
        result = predict_fertilizer(
            temperature=data.temperature,
            humidity=data.humidity,
            moisture=data.moisture,
            soil_type=data.soil_type,
            crop_type=data.crop_type,
            nitrogen=data.nitrogen,
            potassium=data.potassium,
            phosphorous=data.phosphorous,
            config=config,
        )

        fertilizer = result["fertilizer"]
        guidelines = DOSAGE_GUIDELINES.get(fertilizer, {
            "dosage": "Consult local agricultural extension office for dosage",
            "schedule": ["No predefined schedule available for this fertilizer"],
        })

        return PlannerOutput(
            recommended_fertilizer=fertilizer,
            confidence=result["confidence"],
            probabilities=result["probabilities"],
            dosage_advice=guidelines["dosage"],
            application_schedule=guidelines["schedule"],
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail="Fertilizer model not trained yet. Run: python -m ml.train"
        ) from exc
    except Exception as e:
        detail = f"Prediction error: {e}"
        raise HTTPException(status_code=500, detail=detail) from e
