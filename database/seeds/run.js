require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/frauddb';

// ---- Inline minimal schemas for seeding ----
const UserSchema = new mongoose.Schema({ userId: String, email: String, password: String, name: String, role: String, riskScore: Number, riskLevel: String, isFlagged: Boolean, totalTransactions: Number, flaggedTransactions: Number, deviceIds: [String], ipAddresses: [String] }, { timestamps: true });
const TxSchema = new mongoose.Schema({ transactionId: String, userId: String, amount: Number, currency: String, type: String, status: String, riskScore: Number, riskLevel: String, isFraud: Boolean, deviceId: String, ipAddress: String, paymentMethod: String, paymentInstrumentId: String, merchantName: String, merchantCategory: String, behavioralFlags: Object, graphFlags: Object }, { timestamps: true });
const CaseSchema = new mongoose.Schema({ caseId: String, title: String, description: String, status: String, priority: String, type: String, affectedUsers: [String], affectedTransactions: [String], totalAmount: Number, createdBy: String, timeline: [Object] }, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TxSchema);
const FraudCase = mongoose.model('FraudCase', CaseSchema);

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const devices = Array.from({ length: 15 }, () => `dev-${uuidv4().slice(0,8)}`);
const ips = Array.from({ length: 20 }, (_, i) => `192.168.${Math.floor(i/5)}.${(i%5)*50+10}`);
const instruments = Array.from({ length: 12 }, () => `card-${uuidv4().slice(0,8)}`);

const txTypes = ['purchase','transfer','withdrawal','payment'];
const merchants = [
  { name: 'Amazon', category: 'ecommerce' }, { name: 'Uber', category: 'transport' },
  { name: 'Netflix', category: 'subscription' }, { name: 'Apple Store', category: 'tech' },
  { name: 'PayPal Transfer', category: 'transfer' }, { name: 'Walmart', category: 'retail' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  await User.deleteMany({}); await Transaction.deleteMany({}); await FraudCase.deleteMany({});
  console.log('Cleared existing data');

  // 1. Admin user
  const adminPwd = await bcrypt.hash('Admin@1234', 12);
  await User.create({ userId: 'admin-001', email: 'admin@fraudguard.io', password: adminPwd, name: 'Admin User', role: 'admin', riskScore: 0, riskLevel: 'low', isFlagged: false, totalTransactions: 0, flaggedTransactions: 0 });

  // 2. Analyst user
  const analystPwd = await bcrypt.hash('Analyst@1234', 12);
  await User.create({ userId: 'analyst-001', email: 'analyst@fraudguard.io', password: analystPwd, name: 'Jane Analyst', role: 'analyst', riskScore: 0, riskLevel: 'low', isFlagged: false, totalTransactions: 0, flaggedTransactions: 0 });

  // 3. Generate 50 marketplace users
  const userIds = [];
  const users = [];
  for (let i = 0; i < 50; i++) {
    const riskScore = i < 10 ? rand(0.7, 0.99) : i < 25 ? rand(0.4, 0.69) : rand(0.01, 0.39);
    const riskLevel = riskScore >= 0.8 ? 'critical' : riskScore >= 0.6 ? 'high' : riskScore >= 0.4 ? 'medium' : 'low';
    const uid = `user-${uuidv4().slice(0,8)}`;
    userIds.push(uid);
    users.push({ userId: uid, email: `user${i+1}@example.com`, password: 'hashed', name: `User ${i+1}`, role: 'viewer', riskScore, riskLevel, isFlagged: riskScore >= 0.65, totalTransactions: 0, flaggedTransactions: 0, deviceIds: [pick(devices)], ipAddresses: [pick(ips)] });
  }
  await User.insertMany(users);
  console.log('Users seeded');

  // 4. Generate 500 transactions
  const txns = [];
  // First 20 users form a fraud ring — shared device and IP
  const ringDevice = devices[0];
  const ringIp = ips[0];
  const ringInstrument = instruments[0];

  for (let i = 0; i < 500; i++) {
    const userId = pick(userIds);
    const isRingMember = userIds.indexOf(userId) < 8;
    const deviceId = isRingMember ? ringDevice : pick(devices);
    const ipAddress = isRingMember ? ringIp : pick(ips);
    const instrument = isRingMember ? ringInstrument : pick(instruments);
    const amount = isRingMember ? rand(800, 5000) : rand(5, 1200);
    const riskScore = isRingMember ? rand(0.75, 0.99) : rand(0.01, 0.7);
    const riskLevel = riskScore >= 0.8 ? 'critical' : riskScore >= 0.6 ? 'high' : riskScore >= 0.4 ? 'medium' : 'low';
    const status = riskScore >= 0.85 ? 'blocked' : riskScore >= 0.65 ? 'flagged' : riskScore >= 0.4 ? 'under_review' : 'approved';
    const merchant = pick(merchants);
    const daysAgo = Math.floor(rand(0, 30));
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - rand(0, 86400000));

    txns.push({
      transactionId: `txn-${uuidv4().slice(0,12)}`,
      userId, amount: parseFloat(amount.toFixed(2)),
      currency: 'USD', type: pick(txTypes), status,
      riskScore: parseFloat(riskScore.toFixed(4)), riskLevel,
      isFraud: status === 'blocked',
      deviceId, ipAddress,
      paymentMethod: pick(['card','bank_transfer','wallet']),
      paymentInstrumentId: instrument,
      merchantName: merchant.name, merchantCategory: merchant.category,
      behavioralFlags: {
        unusualHour: Math.random() > 0.8,
        velocityBreach: isRingMember && Math.random() > 0.5,
        newDevice: Math.random() > 0.85,
      },
      graphFlags: {
        sharedDevice: isRingMember,
        sharedIp: isRingMember,
        sharedPaymentInstrument: isRingMember,
        connectedToFraudRing: isRingMember,
      },
      createdAt,
    });
  }
  await Transaction.insertMany(txns);
  console.log('Transactions seeded');

  // 5. Fraud cases
  await FraudCase.insertMany([
    { caseId: uuidv4(), title: 'Coordinated Account Takeover Ring', description: 'Group of 8 accounts sharing device and IP conducting high-value transfers', status: 'investigating', priority: 'critical', type: 'fraud_ring', affectedUsers: userIds.slice(0,8), totalAmount: 38400, createdBy: 'analyst-001', timeline: [{ action: 'Case opened', performedBy: 'analyst-001' }, { action: 'Graph analysis initiated', performedBy: 'analyst-001' }] },
    { caseId: uuidv4(), title: 'Suspicious Withdrawal Pattern', description: 'Multiple small withdrawals just below reporting threshold', status: 'open', priority: 'high', type: 'payment_fraud', affectedUsers: [userIds[10]], totalAmount: 4500, createdBy: 'analyst-001', timeline: [{ action: 'Case opened', performedBy: 'admin-001' }] },
    { caseId: uuidv4(), title: 'Promo Abuse Cluster', description: 'Multiple accounts using same device to redeem referral bonuses', status: 'confirmed_fraud', priority: 'medium', type: 'promo_abuse', affectedUsers: userIds.slice(15,20), totalAmount: 1200, createdBy: 'analyst-001', timeline: [{ action: 'Case opened', performedBy: 'analyst-001' }, { action: 'Fraud confirmed', performedBy: 'admin-001' }] },
  ]);
  console.log('Fraud cases seeded');

  console.log('\n=== Seed Complete ===');
  console.log('Admin login:   admin@fraudguard.io / Admin@1234');
  console.log('Analyst login: analyst@fraudguard.io / Analyst@1234');
  await mongoose.disconnect();
}

seed().catch(console.error);
