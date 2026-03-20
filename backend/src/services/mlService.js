const axios = require('axios');
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const predictFraud = async (features) => {
  try {
    const { data } = await axios.post(`${ML_URL}/predict`, { features }, { timeout: 3000 });
    return data;
  } catch {
    const score = Math.min(0.1 + (features.is_night_hour*0.1) + (features.is_new_device*0.15)
      + (features.tx_count_1h > 5 ? 0.2 : 0) + (features.amount_vs_avg_24h > 5 ? 0.25 : 0), 0.95);
    return { risk_score: score, model_version: 'fallback-v1', confidence: 0.5, top_features: [] };
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
