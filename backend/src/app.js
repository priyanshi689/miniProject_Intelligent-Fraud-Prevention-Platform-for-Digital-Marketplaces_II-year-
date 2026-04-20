const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/errorHandler.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "FraudGuard API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth:         "/api/auth",
      transactions: "/api/transactions",
      fraud:        "/api/fraud",
      graph:        "/api/graph",
      cases:        "/api/cases",
      health:       "/api/health",
    },
  });
});

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: 'Too many requests' });

app.get("/api/seed", async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    const User = mongoose.model('User');
    const Transaction = mongoose.model('Transaction');

    await User.deleteMany({});
    await Transaction.deleteMany({});

const adminPwd = await bcrypt.hash('Admin1234', 10);
    // Remove the bcrypt lines and just do:
await User.create({
  userId: 'admin-001',
  email: 'admin@fraudguard.io',
  password: 'Admin1234',  // plain text - model will hash it
  name: 'Admin User',
  role: 'admin',
  riskScore: 0,
  riskLevel: 'low',
  isFlagged: false,
  totalTransactions: 20,
  flaggedTransactions: 4
});
    const txTypes = ['purchase','transfer','withdrawal','payment'];
    const riskLevels = ['low','medium','high','critical'];
    const txDocs = Array.from({length: 20}, (_, i) => ({
      transactionId: `tx-00${i+1}`,
      userId: 'admin-001',
      amount: Math.floor(Math.random() * 5000) + 100,
      currency: 'USD',
      type: txTypes[i % 4],
      status: 'pending',
      riskScore: Math.random(),
      riskLevel: riskLevels[i % 4],
      isFraud: i % 5 === 0,
      ipAddress: `192.168.1.${i+1}`,
      deviceId: `dev-00${i+1}`,
    }));

    await Transaction.insertMany(txDocs);
    res.json({ message: "Seeding completed!", users: 1, transactions: 20 });
  } catch(err) {
    res.json({ error: err.message });
  }
});

    

app.use('/api', limiter);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/cases', require('./routes/case.routes'));
app.use('/api/graph', require('./routes/graph.routes'));
app.use('/api/fraud', require('./routes/fraud.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'fraud-prevention-backend', timestamp: new Date() }));
app.use(errorHandler);

module.exports = app;
