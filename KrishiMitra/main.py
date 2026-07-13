import sys
import os
# Ensure KrishiMitra and the parent workspace root are in the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
sys.path.insert(1, os.path.dirname(current_dir))

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from rag_engine import ask_farming_expert, build_vector_db

from seed_routes import router as seed_router
from routers.diagnose import router as diagnose_router
from routers.voice import router as voice_router
from routers.mandi import router as mandi_router
from routers.planner import router as planner_router
from routers.advisor import router as advisor_router
from routers.council import router as council_router

# 1. Initialize App
app = FastAPI(title="KrishiMitra Intelligence API")

app.include_router(seed_router, prefix="/seeds", tags=["Seed Varieties"])
app.include_router(diagnose_router, prefix="/diagnose", tags=["Leaf Diagnosis"])
app.include_router(voice_router, prefix="/chat/voice", tags=["Voice Assistant"])
app.include_router(mandi_router, prefix="/mandi", tags=["Mandi Market Rates"])
app.include_router(planner_router, prefix="/planner", tags=["Fertilizer Planner"])
app.include_router(advisor_router, prefix="/advisor", tags=["Unified Advisor & Council Models"])
app.include_router(council_router, prefix="/council", tags=["Council of Models"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://krishimitra.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load Data & Models
try:
    # Load ML Model & Encoder
    model = joblib.load(os.path.join(os.path.dirname(current_dir), "models", "crop_recommender_model.pkl"))
    le = joblib.load(os.path.join(os.path.dirname(current_dir), "models", "label_encoder.pkl"))
    
    # Load Regional Nutrient CSV
    nutrient_df = pd.read_csv(os.path.join(current_dir, "data", "raw", "Nutrient.csv"), skiprows=2)
    nutrient_df.columns = [c.strip().replace(' ', '_') for c in nutrient_df.columns]
except Exception as e:
    print(f"Initialization Error: {e}")

# 3. Data Schemas
class CropInput(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

class ChatQuery(BaseModel):
    question: str

# 4. Endpoints
@app.get("/health", tags=["System"])
async def health_check():
    """Readiness / liveness probe."""
    return {"status": "ok"}

@app.get("/", response_class=HTMLResponse)
def home():
    template_path = os.path.join(current_dir, "templates", "index.html")
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse(content="<h1>KrishiMitra backend is online!</h1>")

@app.post("/predict")
async def predict_crop(data: CropInput):
    # ML Prediction
    features = np.array([[data.N, data.P, data.K, data.temperature, data.humidity, data.ph, data.rainfall]])
    prediction_numeric = model.predict(features)
    crop_name = le.inverse_transform(prediction_numeric)[0]
    
    return {
        "recommended_crop": crop_name,
        "input_summary": data.dict(),
        "next_steps": f"You can ask our AI assistant how to grow {crop_name} effectively."
    }

@app.get("/regional-stats/{state}")
async def get_state_data(state: str):
    state_data = nutrient_df[nutrient_df['State'].str.contains(state, case=False, na=False)]
    if state_data.empty:
        raise HTTPException(status_code=404, detail="State data not found.")
    
    return state_data.iloc[0].to_dict()

@app.post("/chat")
async def chat_with_ai(query: ChatQuery):
    try:
        answer = ask_farming_expert(query.question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")

# Optional: Run this once to build the DB
@app.post("/admin/build-db")
async def setup_db():
    build_vector_db()
    return {"message": "Database rebuild triggered"}

import os
import chromadb
from fastapi import HTTPException

@app.get("/debug/db-check")
async def debug_database_verification():
    """
    Temporary Hackathon Diagnostic Route: Reads the local embedded ChromaDB
    directory inside the Render container and returns collection metrics for free.
    """
    # Use the exact local storage path directory defined in your rag_engine.py
    chroma_path = "chroma_db" 
    
    if not os.path.exists(chroma_path):
        return {
            "status": "Offline / Uninitialized",
            "message": f"Directory path '{chroma_path}' not found on disk container storage."
        }
        
    try:
        # Initialize an isolated transient pointer to count records
        client = chromadb.PersistentClient(path=chroma_path)
        collections_data = []
        
        for collection in client.list_collections():
            collections_data.append({
                "collection_name": collection.name,
                "total_records_indexed": collection.count()
            })
            
        return {
            "status": "Healthy & Persistent",
            "chroma_directory_found": True,
            "active_collections": collections_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection trace error: {str(e)}")
