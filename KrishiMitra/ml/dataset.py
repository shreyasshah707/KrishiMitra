"""
KrishiMitra — Fertilizer Dataset Pipeline
==========================================
Handles loading, cleaning, augmenting, encoding, and splitting the
fertilizer recommendation dataset for model training.
"""
import os
import yaml
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
def load_config(config_path: str = "ml/config.yaml") -> dict:
    """Load the YAML configuration file."""
    with open(config_path, "r") as f:
        return yaml.safe_load(f)
def load_raw_data(config: dict) -> pd.DataFrame:
    """
    Load the raw CSV and perform basic cleaning:
      - Strip whitespace from column names
      - Drop rows with all-NaN values
      - Fill remaining NaN with column medians (numerical) or modes (categorical)
    """
    df = pd.read_csv(config["data"]["raw_path"])
    # The original dataset has a trailing space in 'Humidity '
    df.columns = [c.strip() for c in df.columns]
    # Drop fully empty rows
    df.dropna(how="all", inplace=True)
    # Fill missing values
    for col in df.select_dtypes(include=[np.number]).columns:
        df[col].fillna(df[col].median(), inplace=True)
    for col in df.select_dtypes(include=["object"]).columns:
        df[col].fillna(df[col].mode()[0], inplace=True)
    print(f"✅ Loaded raw data: {df.shape[0]} rows × {df.shape[1]} columns")
    return df
def augment_data(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    """
    Synthetically augment the small dataset by adding Gaussian noise to
    numerical features. This preserves categorical features and the target
    label while generating `augmentation_factor` copies per original row.
    Why: The original dataset is only ~99 rows. Adding controlled noise
    helps the model generalize better and reduces overfitting.
    """
    aug_factor = config["training"].get("augmentation_factor", 10)
    seed = config["training"]["random_seed"]
    rng = np.random.default_rng(seed)
    # Fix column name: original has "Temparature", config might vary
    num_cols_raw = config["features"]["numerical"]
    # Strip and normalize to match cleaned column names
    num_cols = [c.strip() for c in num_cols_raw]
    augmented_rows = []
    for _, row in df.iterrows():
        for _ in range(aug_factor):
            new_row = row.copy()
            for col in num_cols:
                if col in df.columns:
                    # Add noise: ±5% of the original value, clipped to stay positive
                    noise = rng.normal(0, 0.05 * max(abs(row[col]), 1))
                    new_row[col] = max(0, row[col] + noise)
            augmented_rows.append(new_row)
    augmented_df = pd.concat([df, pd.DataFrame(augmented_rows)], ignore_index=True)
    print(f"✅ Augmented data: {df.shape[0]} → {augmented_df.shape[0]} rows "
          f"(×{aug_factor} synthetic copies)")
    return augmented_df
def encode_features(df: pd.DataFrame, config: dict, fit: bool = True,
                    encoders: dict = None, scaler: StandardScaler = None):
    """
    Encode categorical features with LabelEncoder and scale numerical
    features with StandardScaler.
    Args:
        df:       The dataframe to encode.
        fit:      If True, fit new encoders/scaler (training mode).
                  If False, use provided encoders/scaler (inference mode).
        encoders: Pre-fitted LabelEncoders (used when fit=False).
        scaler:   Pre-fitted StandardScaler (used when fit=False).
    Returns:
        X:        Feature matrix (numpy array)
        y:        Target labels (numpy array of encoded ints)
        encoders: Dict of fitted LabelEncoders
        scaler:   Fitted StandardScaler
        target_encoder: Fitted LabelEncoder for the target column
    """
    cat_cols_raw = config["features"]["categorical"]
    num_cols_raw = config["features"]["numerical"]
    cat_cols = [c.strip() for c in cat_cols_raw]
    num_cols = [c.strip() for c in num_cols_raw]
    target_col = config["target"].strip()
    if fit:
        encoders = {}
        for col in cat_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            encoders[col] = le
        # Encode target
        target_encoder = LabelEncoder()
        y = target_encoder.fit_transform(df[target_col].astype(str))
        encoders["__target__"] = target_encoder
        # Scale numerical features
        scaler = StandardScaler()
        df[num_cols] = scaler.fit_transform(df[num_cols])
    else:
        for col in cat_cols:
            df[col] = encoders[col].transform(df[col].astype(str))
        y = encoders["__target__"].transform(df[target_col].astype(str))
        df[num_cols] = scaler.transform(df[num_cols])
    feature_cols = num_cols + cat_cols
    X = df[feature_cols].values
    return X, y, encoders, scaler
def prepare_data(config: dict):
    """
    Full pipeline: load → augment → encode → split.
    Returns:
        X_train, X_test, y_train, y_test, encoders, scaler
    """
    df = load_raw_data(config)
    df = augment_data(df, config)
    X, y, encoders, scaler = encode_features(df, config, fit=True)
    test_size = config["training"]["test_size"]
    seed = config["training"]["random_seed"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=seed, stratify=y
    )
    print(f"✅ Split: {X_train.shape[0]} train / {X_test.shape[0]} test samples")
    # Save encoders and scaler for later inference use
    os.makedirs(config["model"]["save_dir"], exist_ok=True)
    joblib.dump(encoders, os.path.join(
        config["model"]["save_dir"], config["model"]["feature_encoders"]))
    joblib.dump(scaler, os.path.join(
        config["model"]["save_dir"], config["model"]["scaler"]))
    print(f"✅ Saved encoders & scaler to {config['model']['save_dir']}/")
    return X_train, X_test, y_train, y_test, encoders, scaler
if __name__ == "__main__":
    cfg = load_config()
    X_train, X_test, y_train, y_test, enc, sc = prepare_data(cfg)
    print(f"\nFeature shape : {X_train.shape}")
    print(f"Target classes: {list(enc['__target__'].classes_)}")