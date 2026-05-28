"""
KrishiMitra — Fertilizer Recommendation Inference
===================================================
Standalone script that loads the trained model, encoders, and scaler,
then predicts the recommended fertilizer for raw user input.
Usage:
    python -m ml.inference
    # Or with arguments:
    python -m ml.inference \
        --temperature 30 \
        --humidity 60 \
        --moisture 45 \
        --soil_type Sandy \
        --crop_type Maize \
        --nitrogen 20 \
        --potassium 10 \
        --phosphorous 15
"""
import os
import sys
import argparse
import numpy as np
import pandas as pd
import joblib
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.dataset import load_config
def load_artifacts(config: dict):
    """Load the trained model, encoders, and scaler from disk."""
    save_dir = config["model"]["save_dir"]
    model = joblib.load(os.path.join(save_dir, config["model"]["filename"]))
    encoders = joblib.load(os.path.join(save_dir, config["model"]["feature_encoders"]))
    scaler = joblib.load(os.path.join(save_dir, config["model"]["scaler"]))
    return model, encoders, scaler
def predict_fertilizer(
    temperature: float,
    humidity: float,
    moisture: float,
    soil_type: str,
    crop_type: str,
    nitrogen: float,
    potassium: float,
    phosphorous: float,
    config: dict = None,
) -> dict:
    """
    Predict the recommended fertilizer from raw input values.
    Args:
        temperature:  Ambient temperature in °C
        humidity:     Relative humidity (%)
        moisture:     Soil moisture content
        soil_type:    One of: Sandy, Loamy, Black, Red, Clayey
        crop_type:    One of: Maize, Sugarcane, Cotton, Tobacco, Paddy,
                      Barley, Wheat, Millets, Oil seeds, Pulses, Ground Nuts
        nitrogen:     Soil nitrogen level
        potassium:    Soil potassium level
        phosphorous:  Soil phosphorous level
    Returns:
        dict with keys: fertilizer, confidence, probabilities
    """
    if config is None:
        config = load_config()
    model, encoders, scaler = load_artifacts(config)
    # Build a single-row dataframe matching the training schema
    input_data = pd.DataFrame([{
        "Temparature": temperature,
        "Humidity": humidity,
        "Moisture": moisture,
        "Soil Type": soil_type,
        "Crop Type": crop_type,
        "Nitrogen": nitrogen,
        "Potassium": potassium,
        "Phosphorous": phosphorous,
    }])
    # Encode categoricals using the same encoders from training
    num_cols = [c.strip() for c in config["features"]["numerical"]]
    cat_cols = [c.strip() for c in config["features"]["categorical"]]
    for col in cat_cols:
        try:
            input_data[col] = encoders[col].transform(input_data[col].astype(str))
        except ValueError as e:
            known = list(encoders[col].classes_)
            raise ValueError(
                f"Unknown {col}: '{input_data[col].iloc[0]}'. "
                f"Known values: {known}"
            ) from e
    # Scale numerical features
    input_data[num_cols] = scaler.transform(input_data[num_cols])
    # Predict
    feature_cols = num_cols + cat_cols
    X = input_data[feature_cols].values
    pred_encoded = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    # Decode prediction
    fertilizer_name = encoders["__target__"].inverse_transform([pred_encoded])[0]
    confidence = float(np.max(proba))
    # Build probability dict for all classes
    class_names = list(encoders["__target__"].classes_)
    prob_dict = {name: round(float(p), 4) for name, p in zip(class_names, proba)}
    return {
        "fertilizer": fertilizer_name,
        "confidence": round(confidence, 4),
        "probabilities": prob_dict,
    }
def main():
    parser = argparse.ArgumentParser(description="Predict recommended fertilizer")
    parser.add_argument("--temperature", type=float, default=30.0)
    parser.add_argument("--humidity", type=float, default=60.0)
    parser.add_argument("--moisture", type=float, default=45.0)
    parser.add_argument("--soil_type", type=str, default="Sandy")
    parser.add_argument("--crop_type", type=str, default="Maize")
    parser.add_argument("--nitrogen", type=float, default=20.0)
    parser.add_argument("--potassium", type=float, default=10.0)
    parser.add_argument("--phosphorous", type=float, default=15.0)
    args = parser.parse_args()
    config = load_config()
    result = predict_fertilizer(
        temperature=args.temperature,
        humidity=args.humidity,
        moisture=args.moisture,
        soil_type=args.soil_type,
        crop_type=args.crop_type,
        nitrogen=args.nitrogen,
        potassium=args.potassium,
        phosphorous=args.phosphorous,
        config=config,
    )
    print("\n" + "=" * 50)
    print("  FERTILIZER RECOMMENDATION")
    print("=" * 50)
    print(f"  🌱 Recommended: {result['fertilizer']}")
    print(f"  📊 Confidence:  {result['confidence'] * 100:.1f}%")
    print(f"\n  All probabilities:")
    for name, prob in sorted(result["probabilities"].items(),
                              key=lambda x: x[1], reverse=True):
        bar = "█" * int(prob * 40)
        print(f"    {name:<12s} {prob * 100:5.1f}% {bar}")
    print("=" * 50)
if __name__ == "__main__":
    main()
