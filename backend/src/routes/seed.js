const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

router.get('/run', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const txnCount = await db.collection('transactions').countDocuments();
    if (txnCount > 0) {
      return res.json({ message: `Already seeded. ${txnCount} transactions exist.` });
    }

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
    const usersResult = await db.collection('users').insertMany(usersData);
    const userIds = Object.values(usersResult.insertedIds);

    const payTypes = ['card','bank_transfer','crypto','wallet'];
    const txnTypes = ['purchase','withdrawal','transfer'];
    const transactions = Array.from({ length: 500 }, (_, i) => {
      const isFraud = Math.random() < 0.12;
      const score = isFraud ? 0.65 + Math.random()*0.34 : Math.random()*0.40;
      const level = score >= 0.85 ? 'critical' : score >= 0.65 ? 'high' : score >= 0.40 ? 'medium' : 'low';
      const status = level === 'critical' ? 'blocked' : level === 'high' ? 'flagged' : 'approved';
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      return {
        transactionId: `TXN-${Date.now()}-${i}-${Math.random().toString(36).slice(2,6)}`,
        userId,
        amount: Math.round((isFraud ? 800+Math.random()*9000 : 10+Math.random()*490)*100)/100,
        paymentType: payTypes[Math.floor(Math.random()*payTypes.length)],
        transactionType: txnTypes[Math.floor(Math.random()*txnTypes.length)],
        deviceId: `DEV-${Math.floor(Math.random()*30)}`,
        ipAddress: `192.168.${Math.floor(Math.random()*20)}.1`,
        riskScore: Math.round(score*1000)/1000,
        riskLevel: level,
        status,
        createdAt: new Date(Date.now() - Math.random()*7*86400000),
        updatedAt: new Date()
      };
    });

    await db.collection('transactions').insertMany(transactions);
    res.json({ success: true, users: usersData.length, transactions: transactions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
