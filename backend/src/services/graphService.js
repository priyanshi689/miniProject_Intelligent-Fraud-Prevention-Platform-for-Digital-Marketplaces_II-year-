const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');
const mongoose = require('mongoose');

const buildEntityGraph = async (userId, depth = 2) => {
  const nodes = [], edges = [], visited = new Set();
  const addNode = (id, type, data = {}) => {
    if (!visited.has(id)) { visited.add(id); nodes.push({ id, type, ...data }); }
  };

  // FIX: try both _id and userId field
  let user = null;
  if (mongoose.Types.ObjectId.isValid(userId)) {
    user = await User.findById(userId).lean();
  }
  if (!user) {
    user = await User.findOne({ userId }).lean();
  }
  if (!user) return { nodes, edges, stats: { totalNodes: 0, totalEdges: 0 } };

  const uid = user._id.toString();

  // FIX: user.email was broken Markdown link
  addNode(uid, 'user', {
    label: user.email,
    riskScore: user.riskScore,
    isFlagged: user.isFlagged
  });

  const txns = await Transaction.find({ userId: user._id }).limit(50).lean();
  const deviceSet = new Set(), ipSet = new Set(), instrumentSet = new Set();

  for (const tx of txns) {
    addNode(tx.transactionId, 'transaction', {
      amount: tx.amount,
      riskScore: tx.riskScore,
      status: tx.status
    });
    edges.push({ source: uid, target: tx.transactionId, type: 'made_transaction' });
    if (tx.deviceId) deviceSet.add(tx.deviceId);
    if (tx.ipAddress) ipSet.add(tx.ipAddress);
    if (tx.paymentInstrumentId) instrumentSet.add(tx.paymentInstrumentId);
  }

  if (depth > 1 && (deviceSet.size || ipSet.size || instrumentSet.size)) {
    const orConditions = [];
    if (deviceSet.size) orConditions.push({ deviceId: { $in: [...deviceSet] } });
    if (ipSet.size) orConditions.push({ ipAddress: { $in: [...ipSet] } });
    if (instrumentSet.size) orConditions.push({ paymentInstrumentId: { $in: [...instrumentSet] } });

    const sharedTxs = await Transaction.find({
      userId: { $ne: user._id },
      $or: orConditions
    }).limit(100).lean();

    const connectedUsers = new Set();
    for (const tx of sharedTxs) {
      const connId = tx.userId.toString();
      if (!connectedUsers.has(connId)) {
        connectedUsers.add(connId);
        addNode(connId, 'connected_user', { riskScore: 0 });
        const linkType = deviceSet.has(tx.deviceId) ? 'shared_device'
          : ipSet.has(tx.ipAddress) ? 'shared_ip' : 'shared_instrument';
        edges.push({ source: uid, target: connId, type: linkType });
      }
    }
  }

  return { nodes, edges, stats: { totalNodes: nodes.length, totalEdges: edges.length } };
};

const detectFraudRings = async () => {
  const rings = await Transaction.aggregate([
    { $group: { _id: '$deviceId', users: { $addToSet: '$userId' }, txCount: { $sum: 1 } } },
    { $match: { 'users.1': { $exists: true }, txCount: { $gte: 3 } } },
  ]);
  return rings.filter(r => r.users.length >= 2);
};

module.exports = { buildEntityGraph, detectFraudRings };
