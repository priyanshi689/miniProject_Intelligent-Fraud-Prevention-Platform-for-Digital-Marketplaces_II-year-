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

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' });
app.get("/api/seed", async (req, res) => {
  try {
    require('../../../database/seeds/run.js');
    res.json({ message: "Seeding completed!" });
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
