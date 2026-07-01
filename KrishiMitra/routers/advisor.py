"""
KrishiMitra — Unified Advisor and Council Models Router
======================================================
Provides routes for:
  - POST /advisor/soil-health — Soil Health Scorer model
  - POST /advisor/predict-yield — Yield Predictor model
  - POST /advisor/irrigation — Irrigation Scheduler model
  - POST /advisor/unified — Council of Models unified advisor utilizing Gemini RAG
"""
import os
import sys
import math
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

router = APIRouter()

# Resolve paths
routers_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(routers_dir))
models_dir = os.path.join(project_root, "models")
chroma_path = os.path.join(project_root, "chroma_db")

# Helper to load models dynamically
def load_model_file(filename: str):
    path = os.path.join(models_dir, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found: {filename}. Please train models first.")
    return joblib.load(path)

# ── Base yields and water requirements data ──
BASE_YIELDS = {
    'rice': 4.5, 'maize': 5.2, 'chickpea': 1.8, 'kidneybeans': 2.0,
    'pigeonpeas': 1.5, 'mothbeans': 1.1, 'mungbean': 1.2, 'blackgram': 1.0,
    'lentil': 1.1, 'pomegranate': 18.0, 'banana': 35.0, 'mango': 12.0,
    'grapes': 8.0, 'watermelon': 25.0, 'muskmelon': 15.0, 'apple': 20.0,
    'orange': 14.0, 'papaya': 30.0, 'coconut': 14.0, 'cotton': 2.1,
    'jute': 2.5, 'coffee': 1.2
}

WATER_REQ = {
    'rice': 1200, 'maize': 600, 'cotton': 700, 'chickpea': 350,
    'kidneybeans': 400, 'pigeonpeas': 450, 'mothbeans': 300, 'mungbean': 400,
    'blackgram': 380, 'lentil': 350, 'pomegranate': 600, 'banana': 1800,
    'mango': 900, 'grapes': 700, 'watermelon': 500, 'muskmelon': 450,
    'apple': 800, 'orange': 750, 'papaya': 1100, 'coconut': 1500,
    'jute': 500, 'coffee': 1200
}

# ── Request / Response Schemas ──

class SharedInput(BaseModel):
    N: float = Field(..., description="Nitrogen content (0-140)", ge=0, le=150)
    P: float = Field(..., description="Phosphorus content (0-145)", ge=0, le=150)
    K: float = Field(..., description="Potassium content (0-205)", ge=0, le=210)
    temperature: float = Field(..., description="Temperature in °C (8-44)", ge=0, le=50)
    humidity: float = Field(..., description="Humidity percentage (14-100)", ge=0, le=100)
    ph: float = Field(..., description="Soil pH level (3.5-10.0)", ge=0, le=14)
    rainfall: float = Field(..., description="Rainfall in mm (20-300)", ge=0, le=500)

class CropInput(SharedInput):
    crop: str = Field(..., description="Crop name (e.g. rice, maize, wheat)")

class SoilHealthOutput(BaseModel):
    score: float
    grade: str
    issues: List[str]
    ph_status: str

class YieldOutput(BaseModel):
    estimated_yield_ton_per_ha: float
    potential_yield_ton_per_ha: float
    gap_percent: float
    limiting_factor: str

class IrrigationOutput(BaseModel):
    seasonal_water_req_mm: int
    rainfall_coverage_mm: float
    irrigation_deficit_mm: float
    irrigations_per_season: int
    next_action: str

class UnifiedAdvisorInput(SharedInput):
    crop_override: Optional[str] = Field(None, description="Optional crop override (e.g. wheat, rice)")

class UnifiedAdvisorOutput(BaseModel):
    crop: str
    soil_health: SoilHealthOutput
    yield_prediction: YieldOutput
    irrigation: IrrigationOutput
    advisor_recommendation: str

# ── Helper Prediction Functions ──

def run_soil_prediction(data: SharedInput) -> SoilHealthOutput:
    model = load_model_file("soil_health_model.pkl")
    features = pd.DataFrame([{
        'N': data.N, 'P': data.P, 'K': data.K,
        'temperature': data.temperature, 'humidity': data.humidity,
        'ph': data.ph, 'rainfall': data.rainfall
    }])
    score = float(model.predict(features)[0])
    
    # Grade logic
    if score >= 85:
        grade = "Excellent"
    elif score >= 70:
        grade = "Good"
    elif score >= 55:
        grade = "Moderate"
    else:
        grade = "Poor"
        
    # Issues logic
    issues = []
    if data.N < 40:
        issues.append("Nitrogen low")
    elif data.N > 100:
        issues.append("Nitrogen high")
    if data.P < 15:
        issues.append("Phosphorus low")
    if data.K < 10:
        issues.append("Potassium low")
    if data.ph < 6.0:
        issues.append("Soil acidic")
    elif data.ph > 7.5:
        issues.append("Soil alkaline")
        
    # pH status
    if 6.0 <= data.ph <= 7.5:
        ph_status = "optimal"
    elif 5.5 <= data.ph < 6.0:
        ph_status = "slightly acidic"
    elif 7.5 < data.ph <= 8.0:
        ph_status = "slightly alkaline"
    elif data.ph < 5.5:
        ph_status = "acidic"
    else:
        ph_status = "alkaline"
        
    return SoilHealthOutput(
        score=round(score, 2),
        grade=grade,
        issues=issues,
        ph_status=ph_status
    )

def run_yield_prediction(data: SharedInput, crop: str) -> YieldOutput:
    model = load_model_file("yield_predictor_model.pkl")
    le = load_model_file("yield_label_encoder.pkl")
    
    crop_clean = crop.lower().strip()
    if crop_clean not in le.classes_:
        # Fallback to nearest class
        crop_clean = "rice"
        
    crop_encoded = int(le.transform([crop_clean])[0])
    
    features = pd.DataFrame([{
        'N': data.N, 'P': data.P, 'K': data.K,
        'temperature': data.temperature, 'humidity': data.humidity,
        'ph': data.ph, 'rainfall': data.rainfall,
        'crop': crop_encoded
    }])
    
    estimated_yield = float(model.predict(features)[0])
    potential_yield = BASE_YIELDS.get(crop_clean, 2.0) * 1.155
    gap_percent = max(0.0, ((potential_yield - estimated_yield) / potential_yield) * 100)
    
    # Identify limiting factors
    limiting_factors = []
    if data.N <= 60:
        limiting_factors.append("Nitrogen deficiency")
    if data.rainfall <= 100:
        limiting_factors.append("Insufficient rainfall")
    if not (18 <= data.temperature <= 32):
        limiting_factors.append("Sub-optimal temperature")
        
    limiting_factor = ", ".join(limiting_factors) if limiting_factors else "None"
    
    return YieldOutput(
        estimated_yield_ton_per_ha=round(estimated_yield, 2),
        potential_yield_ton_per_ha=round(potential_yield, 2),
        gap_percent=round(gap_percent, 2),
        limiting_factor=limiting_factor
    )

def run_irrigation_prediction(data: SharedInput, crop: str) -> IrrigationOutput:
    model = load_model_file("irrigation_model.pkl")
    le = load_model_file("yield_label_encoder.pkl")
    
    crop_clean = crop.lower().strip()
    if crop_clean not in le.classes_:
        crop_clean = "rice"
        
    crop_encoded = int(le.transform([crop_clean])[0])
    
    features = pd.DataFrame([{
        'N': data.N, 'P': data.P, 'K': data.K,
        'temperature': data.temperature, 'humidity': data.humidity,
        'ph': data.ph, 'rainfall': data.rainfall,
        'crop': crop_encoded
    }])
    
    deficit = float(model.predict(features)[0])
    seasonal_water_req = WATER_REQ.get(crop_clean, 500)
    rainfall_coverage = float(min(seasonal_water_req, data.rainfall))
    irrigations = int(math.ceil(deficit / 50))
    
    # Next Action logic
    if data.humidity < 60:
        next_action = "Irrigate within 2 days"
    elif data.humidity < 75:
        next_action = "Irrigate within 5–7 days"
    else:
        next_action = "Irrigation not needed"
        
    return IrrigationOutput(
        seasonal_water_req_mm=seasonal_water_req,
        rainfall_coverage_mm=round(rainfall_coverage, 2),
        irrigation_deficit_mm=round(deficit, 2),
        irrigations_per_season=irrigations,
        next_action=next_action
    )

def run_crop_recommendation(data: SharedInput) -> str:
    model = load_model_file("crop_recommender_model.pkl")
    le = load_model_file("label_encoder.pkl")
    
    features = np.array([[data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall]])
    pred_encoded = model.predict(features)[0]
    return le.inverse_transform([pred_encoded])[0]

# ── RAG context retrieval ──
def get_rag_context(crop: str) -> str:
    if not os.path.exists(chroma_path):
        return "No local agricultural disease guides context available. Rely on general agronomy knowledge."
    try:
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        vector_db = Chroma(persist_directory=chroma_path, embedding_function=embeddings)
        docs = vector_db.similarity_search(f"How to optimize yield, manage soil health, and plan irrigation for {crop}", k=3)
        return "\n\n".join([doc.page_content for doc in docs])
    except Exception as e:
        print(f"Error loading RAG context: {e}")
        return "No local context found. Rely on general agricultural guidelines."

# ── Router Endpoints ──

@router.post("/soil-health", response_model=SoilHealthOutput)
async def predict_soil_health(data: SharedInput):
    """Predict soil health score and categorize soil attributes."""
    try:
        return run_soil_prediction(data)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=503, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Soil Health analysis error: {e}")

@router.post("/predict-yield", response_model=YieldOutput)
async def predict_crop_yield(data: CropInput):
    """Predict crop yield (tonnes/ha) based on input environmental features."""
    try:
        return run_yield_prediction(data, data.crop)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=531, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Yield prediction error: {e}")

@router.post("/irrigation", response_model=IrrigationOutput)
async def predict_irrigation_need(data: CropInput):
    """Predict seasonal water deficit (mm) and required irrigation scheduling."""
    try:
        return run_irrigation_prediction(data, data.crop)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=531, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Irrigation schedule prediction error: {e}")

@router.post("/unified", response_model=UnifiedAdvisorOutput)
async def get_unified_advisory(data: UnifiedAdvisorInput):
    """
    Unified Advisory Endpoint: Orchestrates all 4 model predictions and triggers
    Gemini 2.5 Flash to synthesize a cohesive agricultural recommendation with RAG context grounding.
    """
    try:
        # 1. Determine recommended crop (or override)
        crop = data.crop_override
        if not crop:
            crop = run_crop_recommendation(data)
            
        crop_clean = crop.lower().strip()
        
        # 2. Run specialist models in parallel
        soil_res = run_soil_prediction(data)
        yield_res = run_yield_prediction(data, crop_clean)
        irr_res = run_irrigation_prediction(data, crop_clean)
        
        # 3. Fetch RAG grounding context
        context = get_rag_context(crop_clean)
        
        # 4. Construct prompt for Gemini
        prompt = f"""
You are an expert plant pathologist, agronomist, and agricultural advisor in India.
Synthesize a unified, highly practical recommendation report for a farmer based on the following model analyses and local context.

RETRIEVED AGRI-GUIDE CONTEXT (RAG):
{context}

COUNCIL OF MODELS PREDICTIONS FOR CROP: {crop.upper()}
- Soil Health Score: {soil_res.score}/100 ({soil_res.grade} condition)
- Soil Issues Identified: {', '.join(soil_res.issues) if soil_res.issues else 'None'}
- Soil pH Status: {soil_res.ph_status}
- Yield Prediction: Estimated {yield_res.estimated_yield_ton_per_ha} tonnes/ha (Potential: {yield_res.potential_yield_ton_per_ha} tonnes/ha, Yield Gap: {yield_res.gap_percent}%)
- Yield Limiting Factors: {yield_res.limiting_factor}
- Seasonal Water Requirement: {irr_res.seasonal_water_req_mm} mm
- Seasonal Water Deficit: {irr_res.irrigation_deficit_mm} mm
- Planned Irrigations Needed: {irr_res.irrigations_per_season} sessions
- Urgent Next Action: {irr_res.next_action}

FARM INPUT PARAMETERS:
- NPK Levels: N={data.N}, P={data.P}, K={data.K}
- Climate/Soil conditions: Temperature={data.temperature}°C, Humidity={data.humidity}%, pH={data.ph}, Rainfall={data.rainfall}mm

Provide a concise, extremely professional report structured into 4 sections:
1. **Soil & Nutrient Management**: Direct actions to improve the soil health score and manage NPK balance.
2. **Yield & Productivity Guidance**: How to overcome the yield limiting factors and close the crop's yield gap.
3. **Irrigation & Water Planning**: Specific schedule for watering (immediate vs. seasonal).
4. **General Expert Advisory**: Cautions or practical agronomy tips matching Indian agricultural conditions.
"""
        
        # 5. Invoke Gemini
        gemini_api_key = os.getenv("GOOGLE_API_KEY")
        if not gemini_api_key:
            # Fallback if key not configured
            rec_text = (
                "⚠️ GOOGLE_API_KEY not configured. Rule-Based Fallback:\n\n"
                f"For {crop.upper()}:\n"
                f"1. Soil Health is {soil_res.grade} (Score: {soil_res.score}). Address issues: {soil_res.issues}.\n"
                f"2. Overcome yield limiting factors: {yield_res.limiting_factor} to reach potential yield of {yield_res.potential_yield_ton_per_ha} tonnes/ha.\n"
                f"3. Irrigation Schedule: {irr_res.next_action}. Need {irr_res.irrigations_per_season} irrigations to cover deficit of {irr_res.irrigation_deficit_mm} mm."
            )
        else:
            try:
                model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)
                response = model.invoke(prompt)
                rec_text = response.content
            except Exception as e:
                rec_text = f"⚠️ Gemini API execution error: {e}. Fallback: Please review the model predictions directly."
                
        return UnifiedAdvisorOutput(
            crop=crop,
            soil_health=soil_res,
            yield_prediction=yield_res,
            irrigation=irr_res,
            advisor_recommendation=rec_text
        )
        
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=503, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unified Advisor execution error: {e}")
