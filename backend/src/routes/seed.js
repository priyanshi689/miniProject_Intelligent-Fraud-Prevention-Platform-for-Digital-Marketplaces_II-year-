const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

router.get('/run', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const hashedPw = await bcrypt.hash('Admin@1234', 12);
    const usersData = [
      { email: 'admin@fraudguard.io', password: hashedPw, role: 'admin', name: 'Admin User', isActive: true, createdAt: new Date() },
      { email: 'analyst@fraudguard.io', password: hashedPw, role: 'analyst', name: 'Jane Analyst', isActive: true, createdAt: new Date() },
      ...Array.from({ length: 20 }, (_, i) => ({
        email: `user${i+1}@marketplace.io`,
        password: hashedPw,
        role: 'viewer',
        name: `User ${i+1}`,
        isActive: true,
        createdAt: new Date()
      }))
    ];

    await db.collection('users').deleteMany({});
    await db.collection('transactions').deleteMany({});
    await db.collection('cases').deleteMany({});

    const usersResult = await db.collection('users').insertMany(usersData);
    const userIds = Object.values(usersResult.insertedIds);

    const payTypes = ['card','bank_transfer','crypto','wallet'];
    const txnTypes = ['purchase','withdrawal','transfer'];
    const now = Date.now();

    const transactions = Array.from({ length: 500 }, (_, i) => {
      const isFraud = Math.random() < 0.12;
      const score = isFraud ? 0.65 + Math.random()*0.34 : Math.random()*0.40;
      const level = score >= 0.85 ? 'critical' : score >= 0.65 ? 'high' : score >= 0.40 ? 'medium' : 'low';
      const status = level === 'critical' ? 'blocked' : level === 'high' ? 'flagged' : 'approved';
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      // Fresh dates within last 7 days
      const createdAt = new Date(now - Math.random() * 6 * 86400000);
      return {
        transactionId: `TXN-${now}-${i}-${Math.random().toString(36).slice(2,6)}`,
        userId,
        amount: Math.round((isFraud ? 800+Math.random()*9000 : 10+Math.random()*490)*100)/100,
        paymentType: payTypes[Math.floor(Math.random()*payTypes.length)],
        transactionType: txnTypes[Math.floor(Math.random()*txnTypes.length)],
        deviceId: `DEV-${Math.floor(Math.random()*30)}`,
        ipAddress: `192.168.${Math.floor(Math.random()*20)}.1`,
        riskScore: Math.round(score*1000)/1000,
        riskLevel: level,
        status,
        isFraud: isFraud,
        createdAt,
        updatedAt: createdAt
      };
    });

    await db.collection('transactions').insertMany(transactions);

    // Seed 20 fraud cases
    const highRisk = transactions.filter(t => t.riskLevel === 'critical' || t.riskLevel === 'high').slice(0, 20);
    const caseStatuses = ['open','open','investigating','investigating','confirmed fraud','false positive','closed'];
    const casesData = highRisk.map((txn, i) => ({
      caseId: `CASE-${now}-${i}`,
      transactionId: txn.transactionId,
      userId: txn.userId,
      status: caseStatuses[Math.floor(Math.random()*caseStatuses.length)],
      riskScore: txn.riskScore,
      riskLevel: txn.riskLevel,
      amount: txn.amount,
      description: `Suspicious ${txn.transactionType} of $${txn.amount}`,
      assignedTo: userIds[1],
      createdAt: new Date(now - Math.random()*6*86400000),
      updatedAt: new Date()
    }));

    await db.collection('cases').insertMany(casesData);

    res.json({ success: true, users: usersData.length, transactions: transactions.length, cases: casesData.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
