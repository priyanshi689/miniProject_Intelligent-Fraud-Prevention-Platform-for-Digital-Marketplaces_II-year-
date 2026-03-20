const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['analyst','admin','viewer'], default: 'analyst' },
  name: { type: String, required: true },
  ipAddresses: [String],
  deviceIds: [String],
  riskScore: { type: Number, default: 0, min: 0, max: 1 },
  riskLevel: { type: String, enum: ['low','medium','high','critical'], default: 'low' },
  isFlagged: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  lastLogin: Date,
  totalTransactions: { type: Number, default: 0 },
  flaggedTransactions: { type: Number, default: 0 },
  metadata: { registrationIp: String, userAgent: String, country: String },
}, { timestamps: true });
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = async function(p) { return bcrypt.compare(p, this.password); };
module.exports = mongoose.model('User', userSchema);
