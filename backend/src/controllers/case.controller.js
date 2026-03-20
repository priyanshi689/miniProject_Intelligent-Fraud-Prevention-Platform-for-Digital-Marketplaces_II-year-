const { v4: uuidv4 } = require('uuid');
const FraudCase = require('../models/FraudCase.model');
const Transaction = require('../models/Transaction.model');

const createCase = async (req, res, next) => {
  try {
    const { title, description, type, priority, affectedUsers, affectedTransactions } = req.body;
    const totalAmount = affectedTransactions?.length
      ? (await Transaction.find({ transactionId: { $in: affectedTransactions } }))
          .reduce((s, t) => s + t.amount, 0)
      : 0;

    const fraudCase = await FraudCase.create({
      caseId: uuidv4(), title, description, type,
      priority: priority || 'medium',
      affectedUsers: affectedUsers || [],
      affectedTransactions: affectedTransactions || [],
      totalAmount,
      createdBy: req.user.userId,
      timeline: [{ action: 'Case created', performedBy: req.user.userId }],
    });
    res.status(201).json({ success: true, data: fraudCase });
  } catch (err) { next(err); }
};

const getCases = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    const skip = (page - 1) * limit;
    const [cases, total] = await Promise.all([
      FraudCase.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      FraudCase.countDocuments(filter),
    ]);
    res.json({ success: true, data: cases, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

const getCaseById = async (req, res, next) => {
  try {
    const fraudCase = await FraudCase.findOne({ caseId: req.params.id }).lean();
    if (!fraudCase) return res.status(404).json({ success: false, message: 'Case not found' });
    res.json({ success: true, data: fraudCase });
  } catch (err) { next(err); }
};

const updateCase = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, reviewNotes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (priority) update.priority = priority;
    if (assignedTo) update.assignedTo = assignedTo;
    if (status === 'confirmed_fraud' || status === 'closed') {
      update.resolvedBy = req.user.userId;
      update.resolvedAt = new Date();
    }

    const fraudCase = await FraudCase.findOneAndUpdate(
      { caseId: req.params.id },
      {
        ...update,
        $push: { timeline: { action: `Status updated to ${status}`, performedBy: req.user.userId, note: reviewNotes } }
      },
      { new: true }
    );
    if (!fraudCase) return res.status(404).json({ success: false, message: 'Case not found' });
    res.json({ success: true, data: fraudCase });
  } catch (err) { next(err); }
};

module.exports = { createCase, getCases, getCaseById, updateCase };
