"""
KrishiMitra — Council Models Training Script
============================================
Generates synthetic datasets with realistic Gaussian noise and trains:
  1. Soil Health Scorer (0-100 regression) -> soil_health_model.pkl
  2. Yield Predictor (tonnes/ha regression) -> yield_predictor_model.pkl + yield_label_encoder.pkl
  3. Irrigation Scheduler (deficit mm regression) -> irrigation_model.pkl

Usage:
    python -m ml.train_council
"""
import os
import sys
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import r2_score
import joblib

# Ensure project root is in path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))
models_dir = os.path.join(project_root, "models")
os.makedirs(models_dir, exist_ok=True)

# Set seed for reproducibility
np.random.seed(42)
n_samples = 15000

print("=" * 65)
print("   KrishiMitra - Council Models Generator & Trainer")
print("=" * 65)

# 1. ── Load Crop Classes from Existing Label Encoder ──
original_le_path = os.path.join(models_dir, "label_encoder.pkl")
if os.path.exists(original_le_path):
    print(f"Loading existing crop label encoder: {original_le_path}")
    original_le = joblib.load(original_le_path)
    crop_classes = list(original_le.classes_)
else:
    print("Warning: original label_encoder.pkl not found! Using default 22 crop classes.")
    crop_classes = [
        'rice', 'maize', 'chickpea', 'kidneybeans', 'pigeonpeas', 'mothbeans',
        'mungbean', 'blackgram', 'lentil', 'pomegranate', 'banana', 'mango',
        'grapes', 'watermelon', 'muskmelon', 'apple', 'orange', 'papaya',
        'coconut', 'cotton', 'jute', 'coffee'
    ]

# 2. ── Generate Shared Feature Inputs ──
print("Generating 15,000 synthetic soil and environment profiles...")
N = np.random.uniform(0, 140, n_samples)
P = np.random.uniform(0, 145, n_samples)
K = np.random.uniform(0, 205, n_samples)
temperature = np.random.uniform(8, 44, n_samples)
humidity = np.random.uniform(14, 100, n_samples)
ph = np.random.uniform(3.5, 10.0, n_samples)
rainfall = np.random.uniform(20, 300, n_samples)
crops = np.random.choice(crop_classes, n_samples)

# =====================================================================
# MODEL 1: Soil Health Scorer
# =====================================================================
print("\n--- Training Model 1: Soil Health Scorer ---")

def get_soil_health_score(n_val, p_val, k_val, ph_val):
    # N logic
    if 40 <= n_val <= 80:
        n_pts = 25
    elif 80 < n_val <= 100:
        n_pts = 20
    else:
        n_pts = 10
        
    # P logic
    if p_val > 25:
        p_pts = 25
    elif 15 <= p_val <= 25:
        p_pts = 18
    else:
        p_pts = 10
        
    # K logic
    if k_val > 20:
        k_pts = 25
    elif 10 <= k_val <= 20:
        k_pts = 18
    else:
        k_pts = 10
        
    # pH logic
    if 6.0 <= ph_val <= 7.5:
        ph_pts = 25
    elif (5.5 <= ph_val < 6.0) or (7.5 < ph_val <= 8.0):
        ph_pts = 18
    else:
        ph_pts = 10
        
    return n_pts + p_pts + k_pts + ph_pts

# Calculate target and add Gaussian noise (std ≈ 5% of 60 pts score range = 3.0)
raw_soil_scores = np.array([get_soil_health_score(n, p, k, h) for n, p, k, h in zip(N, P, K, ph)])
soil_scores = np.clip(raw_soil_scores + np.random.normal(0, 3.0, n_samples), 0, 100)

X_soil = pd.DataFrame({
    'N': N, 'P': P, 'K': K,
    'temperature': temperature, 'humidity': humidity,
    'ph': ph, 'rainfall': rainfall
})
y_soil = soil_scores

X_tr, X_te, y_tr, y_te = train_test_split(X_soil, y_soil, test_size=0.2, random_state=42)
soil_model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
soil_model.fit(X_tr, y_tr)

y_pred = soil_model.predict(X_te)
soil_r2 = r2_score(y_te, y_pred)
print(f"Soil Health Scorer Test R^2 Score: {soil_r2:.4f} (Target: >0.8500)")

soil_model_path = os.path.join(models_dir, "soil_health_model.pkl")
joblib.dump(soil_model, soil_model_path)
print(f"Saved soil model to: {soil_model_path}")

# =====================================================================
# MODEL 2: Yield Predictor
# =====================================================================
print("\n--- Training Model 2: Yield Predictor ---")

base_yields = {
  'rice': 4.5, 'maize': 5.2, 'chickpea': 1.8, 'kidneybeans': 2.0,
  'pigeonpeas': 1.5, 'mothbeans': 1.1, 'mungbean': 1.2, 'blackgram': 1.0,
  'lentil': 1.1, 'pomegranate': 18.0, 'banana': 35.0, 'mango': 12.0,
  'grapes': 8.0, 'watermelon': 25.0, 'muskmelon': 15.0, 'apple': 20.0,
  'orange': 14.0, 'papaya': 30.0, 'coconut': 14.0, 'cotton': 2.1,
  'jute': 2.5, 'coffee': 1.2
}

def get_yield(crop, n_val, rain_val, temp_val):
    by = base_yields[crop]
    mult = 1.0
    if n_val > 60:
        mult *= 1.1
    if rain_val > 100:
        mult *= 1.05
    if 18 <= temp_val <= 32:
        mult *= 1.0
    else:
        mult *= 0.9
    return by * mult

# Calculate targets and add crop-proportional Gaussian noise (std ≈ 5% of base yield)
raw_yields = np.array([get_yield(c, n, r, t) for c, n, r, t in zip(crops, N, rainfall, temperature)])
yield_noises = np.array([np.random.normal(0, 0.05 * base_yields[c]) for c in crops])
yields = np.clip(raw_yields + yield_noises, 0.1, None)

# Fit new Yield Label Encoder
yield_le = LabelEncoder()
yield_le.fit(crop_classes)
yield_le_path = os.path.join(models_dir, "yield_label_encoder.pkl")
joblib.dump(yield_le, yield_le_path)
print(f"Saved yield label encoder to: {yield_le_path}")

crops_encoded = yield_le.transform(crops)

X_yield = pd.DataFrame({
    'N': N, 'P': P, 'K': K,
    'temperature': temperature, 'humidity': humidity,
    'ph': ph, 'rainfall': rainfall,
    'crop': crops_encoded
})
y_yield = yields

X_tr, X_te, y_tr, y_te = train_test_split(X_yield, y_yield, test_size=0.2, random_state=42)
yield_model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
yield_model.fit(X_tr, y_tr)

y_pred = yield_model.predict(X_te)
yield_r2 = r2_score(y_te, y_pred)
print(f"Yield Predictor Test R^2 Score: {yield_r2:.4f} (Target: >0.8500)")

yield_model_path = os.path.join(models_dir, "yield_predictor_model.pkl")
joblib.dump(yield_model, yield_model_path)
print(f"Saved yield model to: {yield_model_path}")

# =====================================================================
# MODEL 3: Irrigation Scheduler
# =====================================================================
print("\n--- Training Model 3: Irrigation Scheduler ---")

water_req = {
  'rice': 1200, 'maize': 600, 'cotton': 700, 'chickpea': 350,
  'kidneybeans': 400, 'pigeonpeas': 450, 'mothbeans': 300, 'mungbean': 400,
  'blackgram': 380, 'lentil': 350, 'pomegranate': 600, 'banana': 1800,
  'mango': 900, 'grapes': 700, 'watermelon': 500, 'muskmelon': 450,
  'apple': 800, 'orange': 750, 'papaya': 1100, 'coconut': 1500,
  'jute': 500, 'coffee': 1200
}

# Calculate deficits and add Gaussian noise (std ≈ 5% of max water deficit range: 15.0)
raw_deficits = np.array([max(0, water_req[c] - r) for c, r in zip(crops, rainfall)])
deficits = np.clip(raw_deficits + np.random.normal(0, 15.0, n_samples), 0, None)

X_irr = pd.DataFrame({
    'N': N, 'P': P, 'K': K,
    'temperature': temperature, 'humidity': humidity,
    'ph': ph, 'rainfall': rainfall,
    'crop': crops_encoded
})
y_irr = deficits

X_tr, X_te, y_tr, y_te = train_test_split(X_irr, y_irr, test_size=0.2, random_state=42)
irr_model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
irr_model.fit(X_tr, y_tr)

y_pred = irr_model.predict(X_te)
irr_r2 = r2_score(y_te, y_pred)
print(f"Irrigation Scheduler Test R^2 Score: {irr_r2:.4f} (Target: >0.8500)")

irr_model_path = os.path.join(models_dir, "irrigation_model.pkl")
joblib.dump(irr_model, irr_model_path)
print(f"Saved irrigation model to: {irr_model_path}")

print("\n" + "=" * 65)
print("   All 3 Council Models Generated & Saved Successfully!")
print("=" * 65)
