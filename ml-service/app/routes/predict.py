from flask import Blueprint, request, jsonify
import numpy as np
import joblib
import os
from app.services.feature_engineering import features_to_vector, compute_shap_explanations, FEATURE_ORDER
from app.services.explainability import generate_explanation

predict_bp = Blueprint('predict', __name__)

# Load model once at startup
MODEL_PATH = os.environ.get('MODEL_PATH', 'app/models/behavioral_classifier.pkl')
model = None

def get_model():
    global model
    if model is None:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
        else:
            # Return None to trigger fallback scoring
            return None
    return model

@predict_bp.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        features = data.get('features', {})

        feature_vector = features_to_vector(features)
        clf = get_model()

        if clf is not None:
            proba = clf.predict_proba(feature_vector)[0]
            risk_score = float(proba[1])  # probability of fraud class
            top_features = compute_shap_explanations(clf, feature_vector, FEATURE_ORDER)
            model_version = 'behavioral-v1.0'
            confidence = float(max(proba))
        else:
            # Rule-based fallback when model not trained yet
            risk_score = _rule_based_score(features)
            top_features = []
            model_version = 'rule-based-fallback'
            confidence = 0.6

        explanation = generate_explanation(risk_score, features, top_features)

        return jsonify({
            'risk_score': round(risk_score, 4),
            'model_version': model_version,
            'confidence': confidence,
            'top_features': top_features,
            'explanation': explanation,
        })

    except Exception as e:
        return jsonify({'error': str(e), 'risk_score': 0.5, 'model_version': 'error-fallback', 'confidence': 0.0}), 200


def _rule_based_score(features):
    score = 0.05
    score += features.get('is_night_hour', 0) * 0.15
    score += features.get('is_new_device', 0) * 0.20
    score += features.get('is_new_ip', 0) * 0.10
    score += min(features.get('tx_count_1h', 0) / 10, 0.25)
    ratio = features.get('amount_vs_avg_24h', 1)
    if ratio > 5: score += 0.25
    elif ratio > 3: score += 0.15
    elif ratio > 2: score += 0.05
    return min(score, 0.95)


@predict_bp.route('/train', methods=['POST'])
def train():
    """Endpoint to trigger model retraining with labeled feedback data."""
    try:
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import roc_auc_score
        import pandas as pd

        data = request.get_json()
        records = data.get('records', [])
        if len(records) < 50:
            return jsonify({'error': 'Need at least 50 labeled records to train'}), 400

        df = pd.DataFrame(records)
        X = df[FEATURE_ORDER].fillna(0).values
        y = df['is_fraud'].values

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        clf = GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
        clf.fit(X_train, y_train)

        auc = roc_auc_score(y_test, clf.predict_proba(X_test)[:, 1])
        joblib.dump(clf, MODEL_PATH)

        global model
        model = clf

        return jsonify({'success': True, 'auc_roc': round(auc, 4), 'samples': len(records)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
