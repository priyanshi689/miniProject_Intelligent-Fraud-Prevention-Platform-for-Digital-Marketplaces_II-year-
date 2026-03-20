from flask import Blueprint, request, jsonify
from app.services.gnn_inference import run_gnn_inference

graph_bp = Blueprint('graph', __name__)

@graph_bp.route('/graph-predict', methods=['POST'])
def graph_predict():
    try:
        graph_data = request.get_json()
        result = run_gnn_inference(graph_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e), 'graph_risk_score': 0.0, 'fraud_ring_detected': False}), 200
