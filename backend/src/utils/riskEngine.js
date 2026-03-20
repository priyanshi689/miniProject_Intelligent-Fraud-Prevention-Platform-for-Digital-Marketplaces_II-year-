const enforceDecision = (riskScore, riskLevel) => {
  if (riskLevel === 'critical' || riskScore >= 0.85)
    return { action: 'block', reason: 'Critical risk — auto-blocked', requiresReview: true };
  if (riskLevel === 'high' || riskScore >= 0.65)
    return { action: 'flag', reason: 'High risk — flagged for review', requiresReview: true };
  if (riskLevel === 'medium' || riskScore >= 0.4)
    return { action: 'review', reason: 'Moderate risk — queued', requiresReview: false };
  return { action: 'approve', reason: 'Low risk — approved', requiresReview: false };
};
const computeGraphRiskBoost = (graphFlags) => {
  let boost = 0;
  if (graphFlags.connectedToFraudRing) boost += 0.35;
  if (graphFlags.sharedDevice) boost += 0.1;
  if (graphFlags.sharedIp) boost += 0.08;
  if (graphFlags.sharedPaymentInstrument) boost += 0.12;
  return Math.min(boost, 0.5);
};
module.exports = { enforceDecision, computeGraphRiskBoost };
