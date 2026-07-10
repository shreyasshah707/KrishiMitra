"""
KrishiMitra — Fertilizer Model Training Script
================================================
Full training loop with:
  - Cross-validation scoring
  - Epoch-style logging (forest grows tree by tree — we log at intervals)
  - Best model checkpoint saving
  - Experiment logging to JSON
Usage:
    python -m ml.train
    python -m ml.train --config ml/config.yaml
"""
import os
import sys
import json
import time
import argparse
from datetime import datetime
import numpy as np
import joblib
from sklearn.model_selection import cross_val_score
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report,
)
# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.dataset import load_config, prepare_data
from ml.model import build_model, get_feature_importance
def train(config_path: str = "ml/config.yaml"):
    """
    Complete training pipeline:
      1. Load and preprocess data
      2. Build model
      3. Cross-validate (acts as our "validation loop")
      4. Train on full training set
      5. Evaluate on held-out test set
      6. Save best model checkpoint
      7. Log experiment results
    """
    print("=" * 60)
    print("  KrishiMitra - Fertilizer Model Training")
    print("=" * 60)
    # ── Load config & data ──
    config = load_config(config_path)
    X_train, X_test, y_train, y_test, encoders, scaler = prepare_data(config)
    # ── Build model ──
    model = build_model(config)
    print(f"\nModel: RandomForestClassifier")
    print(f"   Trees: {model.n_estimators}")
    print(f"   Max depth: {model.max_depth or 'unlimited'}")
    print(f"   Class weight: {model.class_weight}")
    # ── Cross-Validation (our "validation loop") ──
    # Since RandomForest isn't epoch-based, we use k-fold CV to
    # estimate generalization performance before final training.
    cv_folds = config["training"]["cv_folds"]
    print(f"\nRunning {cv_folds}-fold cross-validation...")
    cv_accuracy = cross_val_score(
        model, X_train, y_train, cv=cv_folds, scoring="accuracy"
    )
    cv_f1 = cross_val_score(
        model, X_train, y_train, cv=cv_folds, scoring="f1_weighted"
    )
    print(f"   CV Accuracy: {cv_accuracy.mean():.4f} +/- {cv_accuracy.std():.4f}")
    print(f"   CV F1 (weighted): {cv_f1.mean():.4f} +/- {cv_f1.std():.4f}")
    # ── Train final model ──
    print(f"\nTraining final model on {X_train.shape[0]} samples...")
    start_time = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - start_time
    print(f"   Training completed in {train_time:.2f}s")
    # ── Evaluate on test set ──
    y_pred = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred)
    test_f1 = f1_score(y_test, y_pred, average="weighted")
    target_names = list(encoders["__target__"].classes_)
    print(f"\nTest Set Results:")
    print(f"   Accuracy: {test_accuracy:.4f}")
    print(f"   F1 Score: {test_f1:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=target_names)}")
    # ── Feature Importance ──
    num_cols = [c.strip() for c in config["features"]["numerical"]]
    cat_cols = [c.strip() for c in config["features"]["categorical"]]
    feature_names = num_cols + cat_cols
    importances = get_feature_importance(model, feature_names)
    print("Feature Importances:")
    for feat, imp in importances.items():
        bar = "#" * int(imp * 50)
        print(f"   {feat:<15s} {imp:.4f} {bar}")
    # ── Save model checkpoint ──
    save_dir = config["model"]["save_dir"]
    os.makedirs(save_dir, exist_ok=True)
    model_path = os.path.join(save_dir, config["model"]["filename"])
    joblib.dump(model, model_path)
    print(f"\nModel saved to: {model_path}")
    # ── Experiment Log ──
    log_dir = config["logging"]["log_dir"]
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, config["logging"]["log_file"])
    experiment = {
        "timestamp": datetime.now().isoformat(),
        "config": {
            "n_estimators": model.n_estimators,
            "max_depth": model.max_depth,
            "augmentation_factor": config["training"]["augmentation_factor"],
            "test_size": config["training"]["test_size"],
        },
        "results": {
            "cv_accuracy_mean": round(float(cv_accuracy.mean()), 4),
            "cv_accuracy_std": round(float(cv_accuracy.std()), 4),
            "cv_f1_mean": round(float(cv_f1.mean()), 4),
            "cv_f1_std": round(float(cv_f1.std()), 4),
            "test_accuracy": round(float(test_accuracy), 4),
            "test_f1": round(float(test_f1), 4),
            "train_time_seconds": round(train_time, 2),
        },
        "feature_importances": {k: round(float(v), 4) for k, v in importances.items()},
    }
    # Append to log file (supports multiple runs)
    existing_logs = []
    if os.path.exists(log_path):
        with open(log_path, "r") as f:
            existing_logs = json.load(f)
    existing_logs.append(experiment)
    with open(log_path, "w") as f:
        json.dump(existing_logs, f, indent=2)
    print(f"Experiment logged to: {log_path}")
    print("\n" + "=" * 60)
    print("  Training Complete!")
    print("=" * 60)
    return model, encoders, scaler
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the fertilizer recommendation model")
    parser.add_argument("--config", type=str, default="ml/config.yaml",
                        help="Path to the YAML config file")
    args = parser.parse_args()
    train(args.config)