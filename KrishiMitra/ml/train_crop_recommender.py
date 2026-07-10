import os
import sys
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Ensure project root/models directory exists
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))
models_dir = os.path.join(project_root, "models")
os.makedirs(models_dir, exist_ok=True)

# Direct URL to the dataset
dataset_url = "https://raw.githubusercontent.com/Gladiator07/Harvestify/master/Data-processed/crop_recommendation.csv"

print("=" * 65)
print("   KrishiMitra - Crop Recommender Model Training")
print("=" * 65)

# Load the dataset
print(f"Downloading dataset from: {dataset_url}")
try:
    df = pd.read_csv(dataset_url)
    print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
except Exception as e:
    print(f"Error downloading dataset: {e}")
    sys.exit(1)

# Separate features and target
X = df.drop('label', axis=1)
y = df['label']

# Encode the target labels
print("Encoding target labels...")
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Save the label encoder to disk
le_path = os.path.join(models_dir, 'label_encoder.pkl')
joblib.dump(le, le_path)
print(f"Saved label encoder to: {le_path}")

# Split Train and Test Sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# Train the XGBoost Classifier
print("Training XGBoost Classifier...")
model = xgb.XGBClassifier(
    n_estimators=150,
    max_depth=6,
    learning_rate=0.1,
    random_state=42,
    eval_metric='mlogloss'
)
model.fit(X_train, y_train)
print("XGBoost Model training complete!")

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Test Set Accuracy: {accuracy:.4f}\n")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# Save the model
model_path = os.path.join(models_dir, 'crop_recommender_model.pkl')
joblib.dump(model, model_path)
print(f"Saved model to: {model_path}")
print("\nAll crop recommender artifacts generated successfully!")
