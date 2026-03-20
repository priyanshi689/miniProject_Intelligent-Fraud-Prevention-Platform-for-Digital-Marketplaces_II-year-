const rateLimit = require("express-rate-limit");

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for transaction ingestion
const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: { error: "Ingestion rate limit exceeded." },
});

module.exports = { authLimiter, ingestLimiter };
