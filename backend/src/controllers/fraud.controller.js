const User = require('../models/User.model');
const Transaction = require('../models/Transaction.model');

const getHighRiskUsers = async (req, res, next) => {
  try {
    const { limit = 20, minScore = 0.6 } = req.query;
    const users = await User.find({ riskScore: { $gte: Number(minScore) } })
      .sort({ riskScore: -1 }).limit(Number(limit)).lean();
    res.json({ success: true, data: users, count: users.length });
  } catch (err) { next(err); }
};

const getRiskTrend = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 7;
    // FIX: Date.now() was broken as a Markdown link
    const since = new Date(Date.now() - days * 86400000);
    const trend = await Transaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
        flagged: { $sum: { $cond: [{ $in: ['$status', ['flagged', 'blocked']] }, 1, 0] } },
        avgRisk: { $avg: '$riskScore' },
        totalAmount: { $sum: '$amount' },
      }},
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: trend });
  } catch (err) { next(err); }
};

const getRiskDistribution = async (req, res, next) => {
  try {
    const dist = await Transaction.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data: dist });
  } catch (err) { next(err); }
};

module.exports = { getHighRiskUsers, getRiskTrend, getRiskDistribution };
