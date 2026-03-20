import numpy as np

def run_gnn_inference(graph_data: dict) -> dict:
    """
    Accepts a graph with nodes and edges, returns fraud ring score.
    In production: use PyTorch Geometric GNN. Here we implement a 
    rule-based heuristic that mimics GNN output for development.
    """
    nodes = graph_data.get('nodes', [])
    edges = graph_data.get('edges', [])

    if not nodes:
        return {'graph_risk_score': 0.0, 'fraud_ring_detected': False, 'suspicious_nodes': []}

    # Heuristic: score based on shared-signal edge density
    shared_edges = [e for e in edges if e.get('type') in ['shared_device', 'shared_ip', 'shared_instrument']]
    suspicious_nodes = list(set(
        [e['source'] for e in shared_edges] + [e['target'] for e in shared_edges]
    ))

    edge_density = len(shared_edges) / max(len(nodes), 1)
    fraud_ring = len(suspicious_nodes) >= 3 and edge_density > 0.3
    graph_risk_score = min(edge_density * 1.5 + (0.3 if fraud_ring else 0), 1.0)

    return {
        'graph_risk_score': round(graph_risk_score, 4),
        'fraud_ring_detected': fraud_ring,
        'suspicious_nodes': suspicious_nodes[:10],
        'shared_edge_count': len(shared_edges),
        'edge_density': round(edge_density, 4),
    }
