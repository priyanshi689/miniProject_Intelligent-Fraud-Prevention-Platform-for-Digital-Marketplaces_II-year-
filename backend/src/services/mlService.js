const axios = require('axios');
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const predictFraud = async (features) => {
  try {
    const { data } = await axios.post(`${ML_URL}/predict`, { features }, { timeout: 3000 });
    return data;
  } catch {
    // Enhanced fallback scorer - more aggressive risk detection
    let score = 0.05;

    // Night hour transactions are high risk
    if (features.is_night_hour) score += 0.20;

    // New device is very suspicious
    if (features.is_new_device) score += 0.25;

    // New IP is suspicious
    if (features.is_new_ip) score += 0.15;

    // High velocity = fraud pattern
    if (features.tx_count_1h > 3) score += 0.30;
    else if (features.tx_count_1h > 1) score += 0.15;

    // Amount much higher than average
    const ratio = features.amount_vs_avg_24h || 1;
    if (ratio > 10) score += 0.35;
    else if (ratio > 5) score += 0.25;
    else if (ratio > 3) score += 0.15;
    else if (ratio > 2) score += 0.05;

    // High absolute amount
    if (features.amount > 10000) score += 0.20;
    else if (features.amount > 5000) score += 0.10;

    // Bank transfer type = higher risk
    if (features.payment_type_encoded === 1) score += 0.05;

    return {
      risk_score: Math.min(score, 0.97),
      model_version: 'fallback-v2',
      confidence: 0.65,
      top_features: []
    };
  }
};

const predictGraphFraud = async (graphData) => {
  try {
    const { data } = await axios.post(`${ML_URL}/graph-predict`, graphData, { timeout: 5000 });
    return data;
  } catch {
    return { graph_risk_score: 0, fraud_ring_detected: false };
  }
};

module.exports = { predictFraud, predictGraphFraud };
