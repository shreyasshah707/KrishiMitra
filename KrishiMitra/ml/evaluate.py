"""
KrishiMitra — Fertilizer Model Evaluation
==========================================
Generates detailed metrics, confusion matrix, and error analysis
on the test set using the saved model checkpoint.
Usage:
    python -m ml.evaluate
"""
import os
import sys
import numpy as np
import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix,
    classification_report,
)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.dataset import load_config, prepare_data
def evaluate(config_path: str = "ml/config.yaml"):
    """
    Load saved model and evaluate it on the test split.
    Produces:
      - Accuracy, Precision, Recall, F1
      - Per-class classification report
      - Confusion matrix
      - Error analysis: which samples the model gets wrong
    """
    config = load_config(config_path)
    X_train, X_test, y_train, y_test, encoders, scaler = prepare_data(config)
    # Load saved model
    model_path = os.path.join(config["model"]["save_dir"], config["model"]["filename"])
    if not os.path.exists(model_path):
        print(f"❌ Model not found at {model_path}. Run `python -m ml.train` first.")
        return
    model = joblib.load(model_path)
    print(f"✅ Loaded model from {model_path}")
    # Predict
    y_pred = model.predict(X_test)
    target_names = list(encoders["__target__"].classes_)
    # ── Overall Metrics ──
    print("\n" + "=" * 50)
    print("  EVALUATION RESULTS")
    print("=" * 50)
    print(f"  Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"  Precision: {precision_score(y_test, y_pred, average='weighted'):.4f}")
    print(f"  Recall:    {recall_score(y_test, y_pred, average='weighted'):.4f}")
    print(f"  F1 Score:  {f1_score(y_test, y_pred, average='weighted'):.4f}")
    # ── Per-class Report ──
    print(f"\n{'─' * 50}")
    print(classification_report(y_test, y_pred, target_names=target_names))
    # ── Confusion Matrix ──
    cm = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame(cm, index=target_names, columns=target_names)
    print("Confusion Matrix:")
    print(cm_df.to_string())
    # ── Error Analysis ──
    mismatches = np.where(y_test != y_pred)[0]
    if len(mismatches) > 0:
        print(f"\n⚠️  {len(mismatches)} misclassified samples out of {len(y_test)}:")
        for idx in mismatches[:10]:  # Show first 10 errors
            true_label = target_names[y_test[idx]]
            pred_label = target_names[y_pred[idx]]
            print(f"   Sample {idx}: True={true_label} | Predicted={pred_label}")
            print(f"     Features: {X_test[idx]}")
    else:
        print("\n🎉 Zero misclassifications on the test set!")
    print("\n" + "=" * 50)
if __name__ == "__main__":
    evaluate()
