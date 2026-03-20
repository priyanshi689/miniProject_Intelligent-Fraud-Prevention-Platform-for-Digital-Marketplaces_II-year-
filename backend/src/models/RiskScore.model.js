const mongoose = require('mongoose');
const riskScoreSchema = new mongoose.Schema({
  entityId: { type: String, required: true },
  entityType: { type: String, enum: ['user','device','transaction','ip'], required: true },
  score: { type: Number, required: true, min: 0, max: 1 },
  level: { type: String, enum: ['low','medium','high','critical'] },
  components: { behavioralScore: Number, graphScore: Number, velocityScore: Number, deviceScore: Number },
  modelVersion: String, computedAt: { type: Date, default: Date.now },
}, { timestamps: true });
riskScoreSchema.index({ entityId: 1, entityType: 1 });
module.exports = mongoose.model('RiskScore', riskScoreSchema);
