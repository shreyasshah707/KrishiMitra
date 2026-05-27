from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from rag_engine import ask_farming_expert, build_vector_db

# 1. Initialize App
app = FastAPI(title="KrishiMitra Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load Data & Models
try:
    # Load ML Model & Encoder
    model = joblib.load("models/crop_recommender_model.pkl")
    le = joblib.load("models/label_encoder.pkl")
    
    # Load Regional Nutrient CSV
    # skipping 2 rows because your specific CSV had headers on row 3
    nutrient_df = pd.read_csv("data/raw/Nutrient.csv", skiprows=2)
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

@app.get("/")
def home():
    return {"status": "Online", "project": "KrishiMitra"}

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