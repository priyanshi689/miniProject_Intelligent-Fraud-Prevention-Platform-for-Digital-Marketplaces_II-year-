const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  type: { type: String, enum: ['purchase','transfer','withdrawal','refund','payment'], required: true },
  status: { type: String, enum: ['pending','approved','blocked','flagged','under_review'], default: 'pending' },
  riskScore: { type: Number, default: 0, min: 0, max: 1 },
  riskLevel: { type: String, enum: ['low','medium','high','critical'], default: 'low' },
  isFraud: { type: Boolean, default: false },
  fraudConfirmed: { type: Boolean, default: null },
  deviceId: String, ipAddress: String, userAgent: String, country: String,
  paymentMethod: { type: String, enum: ['card','bank_transfer','wallet','crypto'] },
  paymentInstrumentId: String,
  merchantId: String, merchantCategory: String, merchantName: String,
  explanation: {
    topFeatures: [{ feature: String, importance: Number, value: mongoose.Schema.Types.Mixed }],
    modelVersion: String, confidence: Number,
  },
  graphFlags: {
    sharedDevice: { type: Boolean, default: false },
    sharedIp: { type: Boolean, default: false },
    sharedPaymentInstrument: { type: Boolean, default: false },
    connectedToFraudRing: { type: Boolean, default: false },
    fraudRingId: String,
  },
  behavioralFlags: { unusualHour: Boolean, unusualAmount: Boolean, unusualLocation: Boolean, velocityBreach: Boolean, newDevice: Boolean },
  reviewedBy: String, reviewedAt: Date, reviewNotes: String,
}, { timestamps: true });
transactionSchema.index({ userId: 1 }); transactionSchema.index({ riskScore: -1 });
transactionSchema.index({ status: 1 }); transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ deviceId: 1 }); transactionSchema.index({ ipAddress: 1 });
module.exports = mongoose.model('Transaction', transactionSchema);
