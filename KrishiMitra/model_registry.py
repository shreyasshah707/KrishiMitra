"""
KrishiMitra — Model Registry (Lazy-Load & Cache)
=================================================
Centralised loader that lazy-loads every model artifact the first time
it is requested and keeps it in memory for subsequent calls.

Supported formats:
  - .pkl  → joblib.load
  - .h5   → tensorflow.keras.models.load_model
  - .json → json.load (class-index mappings)
"""
import os
import json
import threading
import logging
from typing import Any

import joblib

logger = logging.getLogger("krishimitra.registry")

# ── Paths ──
_REGISTRY_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_REGISTRY_DIR)
MODELS_DIR = os.path.join(_PROJECT_ROOT, "models")
KRISHIMITRA_MODELS_DIR = os.path.join(_REGISTRY_DIR, "models")

# ── Thread-safe cache ──
_cache: dict[str, Any] = {}
_lock = threading.Lock()


def _resolve_path(filename: str) -> str:
    """
    Look for a model file in two locations (in order):
      1. <project_root>/models/       (shared pkl models)
      2. <KrishiMitra>/models/         (fertilizer artifacts, Keras models)
    Returns the first path that exists, or raises FileNotFoundError.
    """
    candidates = [
        os.path.join(MODELS_DIR, filename),
        os.path.join(KRISHIMITRA_MODELS_DIR, filename),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    raise FileNotFoundError(
        f"Model file '{filename}' not found. "
        f"Searched: {candidates}"
    )


def get(filename: str) -> Any:
    """
    Lazy-load and cache a model artifact by filename.

    Supported extensions:
      .pkl  → joblib
      .h5   → tensorflow.keras
      .json → stdlib json (returns dict)
    """
    if filename in _cache:
        return _cache[filename]

    with _lock:
        # Double-checked locking
        if filename in _cache:
            return _cache[filename]

        path = _resolve_path(filename)
        ext = os.path.splitext(filename)[1].lower()

        if ext == ".pkl":
            logger.info("Loading joblib model: %s", path)
            obj = joblib.load(path)

        elif ext in (".h5", ".keras"):
            # Import TF only when needed to avoid startup cost if
            # no Keras models are requested.
            logger.info("Loading Keras model: %s", path)
            try:
                import tensorflow as tf
                obj = tf.keras.models.load_model(path)
            except ImportError:
                raise ImportError(
                    f"TensorFlow is required to load '{filename}'. "
                    "Install it with: pip install tensorflow"
                )

        elif ext == ".json":
            logger.info("Loading JSON mapping: %s", path)
            with open(path, "r", encoding="utf-8") as f:
                obj = json.load(f)

        else:
            raise ValueError(f"Unsupported model extension: {ext}")

        _cache[filename] = obj
        return obj


def preload(*filenames: str) -> None:
    """Eagerly load a batch of artifacts (useful at startup)."""
    for fn in filenames:
        try:
            get(fn)
        except Exception as exc:
            logger.warning("Failed to preload '%s': %s", fn, exc)


def is_available(filename: str) -> bool:
    """Check whether a model file exists on disk (does not load it)."""
    try:
        _resolve_path(filename)
        return True
    except FileNotFoundError:
        return False
