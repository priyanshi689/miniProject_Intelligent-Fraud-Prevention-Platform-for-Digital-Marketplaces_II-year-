const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');
const Device = require('../models/Device.model');
const { predictFraud } = require('../services/mlService');
const { extractFeatures, getRiskLevel } = require('../utils/featureExtractor');
const { enforceDecision, computeGraphRiskBoost } = require('../utils/riskEngine');
const { cacheSet, cacheGet } = require('../services/redisService');

// POST /api/transactions/ingest  — main event ingestion endpoint
const ingestTransaction = async (req, res, next) => {
  try {
    const { userId, amount, currency, type, deviceId, ipAddress, userAgent,
            paymentMethod, paymentInstrumentId, merchantId, merchantName, merchantCategory } = req.body;

    // Fetch user history for behavioral features
    const history = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    const isNewDevice = !history.some(t => t.deviceId === deviceId);
    const isNewIp = !history.some(t => t.ipAddress === ipAddress);

    const features = extractFeatures(
      { amount, type, paymentMethod, deviceId, ipAddress, isNewDevice, isNewIp },
      history
    );

    // Call ML service
    const mlResult = await predictFraud(features);
    let riskScore = mlResult.risk_score;

    // Check graph flags
    const sharedDeviceTx = deviceId ? await Transaction.findOne({ deviceId, userId: { $ne: userId } }) : null;
    const sharedIpTx = ipAddress ? await Transaction.findOne({ ipAddress, userId: { $ne: userId } }) : null;
    const sharedInstrumentTx = paymentInstrumentId ? await Transaction.findOne({ paymentInstrumentId, userId: { $ne: userId } }) : null;

    const graphFlags = {
      sharedDevice: !!sharedDeviceTx,
      sharedIp: !!sharedIpTx,
      sharedPaymentInstrument: !!sharedInstrumentTx,
      connectedToFraudRing: false,
    };

    riskScore = Math.min(riskScore + computeGraphRiskBoost(graphFlags), 1.0);
    const riskLevel = getRiskLevel(riskScore);
    const { action, reason, requiresReview } = enforceDecision(riskScore, riskLevel);

    const statusMap = { block: 'blocked', flag: 'flagged', review: 'under_review', approve: 'approved' };

    const transaction = await Transaction.create({
      transactionId: uuidv4(),
      userId, amount, currency: currency || 'USD', type,
      deviceId, ipAddress, userAgent,
      paymentMethod, paymentInstrumentId,
      merchantId, merchantName, merchantCategory,
      riskScore, riskLevel,
      status: statusMap[action],
      isFraud: action === 'block',
      behavioralFlags: {
        unusualHour: features.is_night_hour === 1,
        unusualAmount: features.amount_vs_avg_24h > 3,
        velocityBreach: features.tx_count_1h > 5,
        newDevice: isNewDevice,
        newIp: isNewIp,
      },
      graphFlags,
      explanation: {
        topFeatures: mlResult.top_features || [],
        modelVersion: mlResult.model_version,
        confidence: mlResult.confidence,
      },
    });

    // Update device record
    if (deviceId) {
      await Device.findOneAndUpdate(
        { deviceId },
        { $addToSet: { userIds: userId, ipAddresses: ipAddress }, $inc: { transactionCount: 1 }, lastSeen: new Date() },
        { upsert: true, new: true }
      );
    }

    // Update user risk profile
    await User.findOneAndUpdate({ userId }, {
      $inc: { totalTransactions: 1, flaggedTransactions: requiresReview ? 1 : 0 },
      $addToSet: { deviceIds: deviceId, ipAddresses: ipAddress },
      riskScore: riskScore,
      riskLevel,
      isFlagged: riskLevel === 'high' || riskLevel === 'critical',
    });

    // Invalidate cache
    await cacheSet(`txn:${transaction.transactionId}`, transaction, 300);

    // Emit real-time alert via Socket.io if high risk
    if (requiresReview && req.app.get('io')) {
      req.app.get('io').emit('fraud_alert', {
        transactionId: transaction.transactionId,
        userId, riskScore, riskLevel, action, reason,
        amount, timestamp: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      transactionId: transaction.transactionId,
      decision: { action, reason, riskScore, riskLevel },
      transaction,
    });
  } catch (err) { next(err); }
};

// GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, riskLevel, userId, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (userId) filter.userId = userId;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({ success: true, data: transactions, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// GET /api/transactions/:id
const getTransactionById = async (req, res, next) => {
  try {
    const cached = await cacheGet(`txn:${req.params.id}`);
    if (cached) return res.json({ success: true, data: cached, source: 'cache' });

    const tx = await Transaction.findOne({ transactionId: req.params.id }).lean();
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    await cacheSet(`txn:${req.params.id}`, tx, 300);
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

// PATCH /api/transactions/:id/review
const reviewTransaction = async (req, res, next) => {
  try {
    const { fraudConfirmed, reviewNotes } = req.body;
    const tx = await Transaction.findOneAndUpdate(
      { transactionId: req.params.id },
      { fraudConfirmed, reviewNotes, reviewedBy: req.user.userId, reviewedAt: new Date(),
        status: fraudConfirmed ? 'blocked' : 'approved' },
      { new: true }
    );
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

// GET /api/transactions/stats/summary
const getStats = async (req, res, next) => {
  try {
    const cached = await cacheGet('stats:summary');
    if (cached) return res.json({ success: true, data: cached });

    const [total, blocked, flagged, approved, totalAmountResult, fraudRateResult] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'blocked' }),
      Transaction.countDocuments({ status: 'flagged' }),
      Transaction.countDocuments({ status: 'approved' }),
      Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([
        { $group: { _id: null, fraudCount: { $sum: { $cond: ['$isFraud', 1, 0] } }, total: { $sum: 1 } } }
      ]),
    ]);

    const stats = {
      total, blocked, flagged, approved,
      totalAmount: totalAmountResult[0]?.total || 0,
      fraudRate: fraudRateResult[0] ? (fraudRateResult[0].fraudCount / fraudRateResult[0].total * 100).toFixed(2) : 0,
    };

    await cacheSet('stats:summary', stats, 60);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
};

module.exports = { ingestTransaction, getTransactions, getTransactionById, reviewTransaction, getStats };
