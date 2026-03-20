const mongoose = require('mongoose');
const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  userIds: [String], ipAddresses: [String],
  userAgent: String,
  deviceType: { type: String, enum: ['mobile','desktop','tablet','unknown'], default: 'unknown' },
  os: String, browser: String,
  isFlagged: { type: Boolean, default: false },
  riskScore: { type: Number, default: 0 },
  transactionCount: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });
module.exports = mongoose.model('Device', deviceSchema);
