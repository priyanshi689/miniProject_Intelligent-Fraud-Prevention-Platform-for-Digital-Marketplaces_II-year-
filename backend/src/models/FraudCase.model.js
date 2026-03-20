const mongoose = require('mongoose');
const fraudCaseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['open','investigating','confirmed_fraud','false_positive','closed'], default: 'open' },
  priority: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  type: { type: String, enum: ['account_takeover','payment_fraud','identity_theft','fraud_ring','promo_abuse','chargeback_fraud'], required: true },
  affectedUsers: [String], affectedTransactions: [String],
  totalAmount: { type: Number, default: 0 },
  assignedTo: String, createdBy: String, resolvedBy: String, resolvedAt: Date,
  timeline: [{ action: String, performedBy: String, note: String, timestamp: { type: Date, default: Date.now } }],
  fraudRingId: String, mlInsights: mongoose.Schema.Types.Mixed, tags: [String],
}, { timestamps: true });
module.exports = mongoose.model('FraudCase', fraudCaseSchema);
