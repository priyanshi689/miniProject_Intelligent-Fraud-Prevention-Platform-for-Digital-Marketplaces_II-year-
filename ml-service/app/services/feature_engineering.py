import numpy as np

FEATURE_ORDER = [
    'amount', 'hour_of_day', 'day_of_week', 'is_weekend', 'is_night_hour',
    'tx_count_1h', 'tx_count_24h', 'tx_count_7d', 'amount_vs_avg_24h',
    'is_new_device', 'is_new_ip', 'payment_type_encoded', 'transaction_type_encoded'
]

def features_to_vector(feature_dict: dict) -> np.ndarray:
    """Convert feature dict to ordered numpy array for model input."""
    return np.array([[feature_dict.get(f, 0) for f in FEATURE_ORDER]], dtype=np.float32)

def compute_shap_explanations(model, feature_vector, feature_names=None):
    """Return top feature importances using tree-based feature importances as fallback."""
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(feature_vector)
        vals = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
        names = feature_names or FEATURE_ORDER
        top = sorted(zip(names, vals, feature_vector[0]), key=lambda x: abs(x[1]), reverse=True)[:5]
        return [{'feature': f, 'importance': float(abs(i)), 'value': float(v)} for f, i, v in top]
    except Exception:
        return []
