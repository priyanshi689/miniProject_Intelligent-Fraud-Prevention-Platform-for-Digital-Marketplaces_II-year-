def generate_explanation(risk_score: float, features: dict, top_features: list) -> dict:
    """Generate human-readable fraud explanation for analysts."""
    reasons = []

    if features.get('is_night_hour'):
        reasons.append('Transaction occurred during unusual hours (midnight–5am)')
    if features.get('is_new_device'):
        reasons.append('New device not previously associated with this account')
    if features.get('tx_count_1h', 0) > 5:
        reasons.append(f"High transaction velocity: {features['tx_count_1h']} transactions in the last hour")
    if features.get('amount_vs_avg_24h', 1) > 3:
        reasons.append(f"Amount is {features['amount_vs_avg_24h']:.1f}x the user's 24h average")
    if features.get('is_new_ip'):
        reasons.append('Transaction from a new IP address')

    level = 'critical' if risk_score >= 0.8 else 'high' if risk_score >= 0.6 else 'medium' if risk_score >= 0.4 else 'low'

    return {
        'risk_level': level,
        'risk_score': round(risk_score, 4),
        'reasons': reasons,
        'top_features': top_features,
        'recommendation': {
            'critical': 'Block immediately and open fraud case',
            'high': 'Flag for analyst review, consider step-up authentication',
            'medium': 'Monitor closely, soft review recommended',
            'low': 'Approve — within normal behavior patterns',
        }[level]
    }
