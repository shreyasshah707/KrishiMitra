"""
KrishiMitra — Fertilizer Engine Service
=========================================
Business logic layer for calculating optimal fertilizer recommendation,
combining the scikit-learn ML pipeline predictions with crop limits.
"""

from typing import dict
from ml.inference import predict_fertilizer, load_config


def calculate_fertilizer_plan(
    temperature: float,
    humidity: float,
    moisture: float,
    soil_type: str,
    crop_type: str,
    nitrogen: float,
    potassium: float,
    phosphorous: float
) -> dict:
    """
    Wraps the scikit-learn inference pipeline.
    """
    config = load_config()
    
    # Predict from model
    prediction_result = predict_fertilizer(
        temperature=temperature,
        humidity=humidity,
        moisture=moisture,
        soil_type=soil_type,
        crop_type=crop_type,
        nitrogen=nitrogen,
        potassium=potassium,
        phosphorous=phosphorous,
        config=config
    )
    
    return prediction_result