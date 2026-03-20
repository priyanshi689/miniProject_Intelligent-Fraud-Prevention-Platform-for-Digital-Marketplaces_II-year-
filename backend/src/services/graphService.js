const Transaction = require('../models/Transaction.model');
const User = require('../models/User.model');

const buildEntityGraph = async (userId, depth = 2) => {
  const nodes = [], edges = [], visited = new Set();
  const addNode = (id, type, data={}) => { if(!visited.has(id)){ visited.add(id); nodes.push({id,type,...data}); }};

  const user = await User.findOne({ userId });
  if (!user) return { nodes, edges };
  addNode(userId, 'user', { label: user.email, riskScore: user.riskScore, isFlagged: user.isFlagged });

  const txns = await Transaction.find({ userId }).limit(50).lean();
  const deviceSet = new Set(), ipSet = new Set(), instrumentSet = new Set();
  for (const tx of txns) {
    addNode(tx.transactionId, 'transaction', { amount: tx.amount, riskScore: tx.riskScore, status: tx.status });
    edges.push({ source: userId, target: tx.transactionId, type: 'made_transaction' });
    if (tx.deviceId) deviceSet.add(tx.deviceId);
    if (tx.ipAddress) ipSet.add(tx.ipAddress);
    if (tx.paymentInstrumentId) instrumentSet.add(tx.paymentInstrumentId);
  }

  if (depth > 1) {
    const sharedTxs = await Transaction.find({
      userId: { $ne: userId },
      $or: [{ deviceId: { $in: [...deviceSet] } }, { ipAddress: { $in: [...ipSet] } }, { paymentInstrumentId: { $in: [...instrumentSet] } }]
    }).limit(100).lean();
    const connectedUsers = new Set();
    for (const tx of sharedTxs) {
      if (!connectedUsers.has(tx.userId)) {
        connectedUsers.add(tx.userId);
        addNode(tx.userId, 'connected_user', { riskScore: 0 });
        const linkType = deviceSet.has(tx.deviceId) ? 'shared_device' : ipSet.has(tx.ipAddress) ? 'shared_ip' : 'shared_instrument';
        edges.push({ source: userId, target: tx.userId, type: linkType });
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
