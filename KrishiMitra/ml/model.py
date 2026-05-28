from sklearn.ensemble import RandomForestClassifier
def build_model(config: dict) -> RandomForestClassifier:

    rf_cfg = config["random_forest"]
    model = RandomForestClassifier(
        n_estimators=rf_cfg["n_estimators"],
        max_depth=rf_cfg["max_depth"],
        min_samples_split=rf_cfg["min_samples_split"],
        min_samples_leaf=rf_cfg["min_samples_leaf"],
        class_weight=rf_cfg["class_weight"],
        random_state=config["training"]["random_seed"],
        n_jobs=-1,  # Use all CPU cores for parallel tree fitting
    )
    return model
def get_feature_importance(model: RandomForestClassifier,
                           feature_names: list) -> dict:
    """
    Extract and rank feature importances from the trained forest.
    Returns a dict sorted by importance (descending).
    """
    importances = model.feature_importances_
    importance_dict = dict(zip(feature_names, importances))
    return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))