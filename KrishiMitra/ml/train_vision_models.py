"""
KrishiMitra — Vision Models Training Script
============================================
Generates synthetic image datasets and trains two lightweight Keras CNNs:
  1. Growth Stage Classifier  → growth_stage_model.h5
                                growth_stage_index.json
                                growth_stage_classes.json
  2. Pest/Disease Identifier  → pest_identifier_model.h5
                                pest_classes.json

These are demo-grade models trained on synthetic images with class-distinctive
colour and texture patterns.  They produce structurally valid predictions that
integrate with the Council of Models pipeline, but should be replaced with
models trained on real agricultural imagery for production use.

Usage:
    python KrishiMitra/ml/train_vision_models.py
    # or from inside KrishiMitra/:
    python -m ml.train_vision_models
"""
import os
import json
import numpy as np

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))
models_dir = os.path.join(project_root, "models")
os.makedirs(models_dir, exist_ok=True)

np.random.seed(42)

# ---------------------------------------------------------------------------
# Class definitions
# ---------------------------------------------------------------------------

GROWTH_STAGES = [
    "germination",
    "seedling",
    "vegetative",
    "flowering",
    "fruiting",
    "maturity",
]

PEST_CLASSES = [
    "healthy",
    "aphid_damage",
    "bacterial_blight",
    "brown_spot",
    "leaf_curl",
    "powdery_mildew",
    "rust",
    "stem_borer",
]

# ---------------------------------------------------------------------------
# Synthetic image generator
# ---------------------------------------------------------------------------

def _generate_synthetic_images(
    class_names: list[str],
    img_size: int = 224,
    samples_per_class: int = 120,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic RGB images with class-distinctive colour channels
    and random Gaussian noise so that a CNN can learn to separate them.

    Each class gets a unique (R, G, B) centroid; individual images are
    the centroid plus per-pixel Gaussian noise, producing subtle but
    learnable patterns.
    """
    n_classes = len(class_names)
    total = n_classes * samples_per_class

    # Pre-allocate
    X = np.empty((total, img_size, img_size, 3), dtype=np.float32)
    y = np.empty(total, dtype=np.int32)

    # Evenly-spaced hue centroids converted to simple RGB bands
    for idx, _cls in enumerate(class_names):
        base_r = 0.2 + 0.6 * (idx / max(n_classes - 1, 1))
        base_g = 0.8 - 0.5 * (idx / max(n_classes - 1, 1))
        base_b = 0.3 + 0.4 * ((idx % 3) / 2.0)

        for j in range(samples_per_class):
            pos = idx * samples_per_class + j
            img = np.stack(
                [
                    np.full((img_size, img_size), base_r, dtype=np.float32),
                    np.full((img_size, img_size), base_g, dtype=np.float32),
                    np.full((img_size, img_size), base_b, dtype=np.float32),
                ],
                axis=-1,
            )
            # Add per-pixel Gaussian noise
            noise = np.random.normal(0, 0.08, img.shape).astype(np.float32)
            img = np.clip(img + noise, 0.0, 1.0)
            X[pos] = img
            y[pos] = idx

    # Shuffle
    perm = np.random.permutation(total)
    return X[perm], y[perm]


# ---------------------------------------------------------------------------
# Model builder
# ---------------------------------------------------------------------------

def _build_small_cnn(input_size: int, num_classes: int):
    """
    Build a lightweight CNN suitable for demo/synthetic data.
    Architecture: 3 × (Conv2D → BatchNorm → ReLU → MaxPool) → GlobalAvgPool → Dense
    """
    import tensorflow as tf

    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(input_size, input_size, 3)),
            # Block 1
            tf.keras.layers.Conv2D(16, 3, padding="same"),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.ReLU(),
            tf.keras.layers.MaxPooling2D(),
            # Block 2
            tf.keras.layers.Conv2D(32, 3, padding="same"),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.ReLU(),
            tf.keras.layers.MaxPooling2D(),
            # Block 3
            tf.keras.layers.Conv2D(64, 3, padding="same"),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.ReLU(),
            tf.keras.layers.GlobalAveragePooling2D(),
            # Head
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(num_classes, activation="softmax"),
        ]
    )

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


# =====================================================================
# MAIN
# =====================================================================

def main():
    # Lazy TF import so the module can be loaded without TF installed
    import tensorflow as tf

    print("=" * 65)
    print("   KrishiMitra — Vision Models Generator & Trainer")
    print("=" * 65)

    # ------------------------------------------------------------------
    # MODEL 1: Growth Stage Classifier
    # ------------------------------------------------------------------
    print("\n--- Training Model 1: Growth Stage Classifier ---")
    print(f"Classes ({len(GROWTH_STAGES)}): {GROWTH_STAGES}")

    IMG_SIZE_GS = 128  # smaller than 224 for fast training
    X_gs, y_gs = _generate_synthetic_images(
        GROWTH_STAGES, img_size=IMG_SIZE_GS, samples_per_class=150,
    )
    print(f"Synthetic dataset: {X_gs.shape[0]} images @ {IMG_SIZE_GS}×{IMG_SIZE_GS}")

    split = int(0.8 * len(X_gs))
    X_train, X_test = X_gs[:split], X_gs[split:]
    y_train, y_test = y_gs[:split], y_gs[split:]

    gs_model = _build_small_cnn(IMG_SIZE_GS, len(GROWTH_STAGES))
    gs_model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=10,
        batch_size=32,
        verbose=1,
    )

    loss, acc = gs_model.evaluate(X_test, y_test, verbose=0)
    print(f"Growth Stage — Test Accuracy: {acc:.4f}")

    gs_model_path = os.path.join(models_dir, "growth_stage_model.h5")
    gs_model.save(gs_model_path)
    print(f"Saved growth stage model to: {gs_model_path}")

    # Save class mappings (council.py expects both files)
    gs_index = {str(i): name for i, name in enumerate(GROWTH_STAGES)}
    gs_index_path = os.path.join(models_dir, "growth_stage_index.json")
    with open(gs_index_path, "w", encoding="utf-8") as f:
        json.dump(gs_index, f, indent=2)
    print(f"Saved index map to: {gs_index_path}")

    gs_classes_path = os.path.join(models_dir, "growth_stage_classes.json")
    with open(gs_classes_path, "w", encoding="utf-8") as f:
        json.dump(GROWTH_STAGES, f, indent=2)
    print(f"Saved class list to: {gs_classes_path}")

    # ------------------------------------------------------------------
    # MODEL 2: Pest / Disease Identifier
    # ------------------------------------------------------------------
    print("\n--- Training Model 2: Pest / Disease Identifier ---")
    print(f"Classes ({len(PEST_CLASSES)}): {PEST_CLASSES}")

    IMG_SIZE_PEST = 224  # matches council.py hard-coded 224×224
    X_pest, y_pest = _generate_synthetic_images(
        PEST_CLASSES, img_size=IMG_SIZE_PEST, samples_per_class=120,
    )
    print(f"Synthetic dataset: {X_pest.shape[0]} images @ {IMG_SIZE_PEST}×{IMG_SIZE_PEST}")

    split = int(0.8 * len(X_pest))
    X_train, X_test = X_pest[:split], X_pest[split:]
    y_train, y_test = y_pest[:split], y_pest[split:]

    pest_model = _build_small_cnn(IMG_SIZE_PEST, len(PEST_CLASSES))
    pest_model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=10,
        batch_size=32,
        verbose=1,
    )

    loss, acc = pest_model.evaluate(X_test, y_test, verbose=0)
    print(f"Pest Identifier — Test Accuracy: {acc:.4f}")

    pest_model_path = os.path.join(models_dir, "pest_identifier_model.h5")
    pest_model.save(pest_model_path)
    print(f"Saved pest identifier model to: {pest_model_path}")

    pest_classes_path = os.path.join(models_dir, "pest_classes.json")
    with open(pest_classes_path, "w", encoding="utf-8") as f:
        json.dump(PEST_CLASSES, f, indent=2)
    print(f"Saved pest class list to: {pest_classes_path}")

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print("\n" + "=" * 65)
    print("   All Vision Models Generated & Saved Successfully!")
    print("=" * 65)
    print(f"\nArtifacts in {models_dir}:")
    for fname in [
        "growth_stage_model.h5",
        "growth_stage_index.json",
        "growth_stage_classes.json",
        "pest_identifier_model.h5",
        "pest_classes.json",
    ]:
        path = os.path.join(models_dir, fname)
        status = "[OK]" if os.path.exists(path) else "[MISSING]"
        size = ""
        if os.path.exists(path):
            size_bytes = os.path.getsize(path)
            if size_bytes > 1_000_000:
                size = f" ({size_bytes / 1_000_000:.1f} MB)"
            else:
                size = f" ({size_bytes / 1_000:.1f} KB)"
        print(f"  {status}  {fname}{size}")


if __name__ == "__main__":
    main()
