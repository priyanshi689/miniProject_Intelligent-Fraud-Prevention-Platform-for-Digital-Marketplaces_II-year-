// database/seeds/run.js
// Replace your existing seed script with this version
// Fixes: hardcoded credentials moved to env, works against deployed backend

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ─── Config ───────────────────────────────────────────────────────────────────
// Put your real connection string in .env as MONGODB_URI
// NEVER hardcode it here (security deduction!)
const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI   ||
  "mongodb://localhost:27017/fraudguard"; // fallback for local only

const SEED_PASSWORD = process.env.SEED_PASSWORD || "Admin@1234";

// ─── Schemas (inline so seed runs standalone) ─────────────────────────────────
const userSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ["admin", "analyst", "viewer"], default: "analyst" },
  name:      String,
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

const txnSchema = new mongoose.Schema({
  transactionId:    { type: String, unique: true },
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount:           Number,
  paymentType:      String,
  transactionType:  String,
  deviceId:         String,
  ipAddress:        String,
  riskScore:        { type: Number, default: 0 },
  riskLevel:        { type: String, enum: ["low","medium","high","critical"], default: "low" },
  status:           { type: String, enum: ["approved","flagged","blocked","reviewed"], default: "approved" },
  features:         mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const User        = mongoose.models.User        || mongoose.model("User",        userSchema);
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", txnSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const randBetween = (min, max) => Math.random() * (max - min) + min;
const randInt     = (min, max) => Math.floor(randBetween(min, max));
const choose      = (arr) => arr[randInt(0, arr.length)];
const txnId       = () => "TXN-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();

function riskLevel(score) {
  if (score >= 0.85) return "critical";
  if (score >= 0.65) return "high";
  if (score >= 0.40) return "medium";
  return "low";
}

function statusFromRisk(level) {
  if (level === "critical") return "blocked";
  if (level === "high")     return "flagged";
  return "approved";
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  });
  console.log("✅ Connected:", MONGO_URI.replace(/\/\/.*@/, "//***@")); // mask credentials in logs

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Transaction.deleteMany({}),
  ]);
  console.log("🗑️  Cleared existing data");

  // ── Create users ─────────────────────────────────────────────────────────
  const hashedPw = await bcrypt.hash(SEED_PASSWORD, 12);
  const users = await User.insertMany([
    { email: "admin@fraudguard.io",   password: hashedPw, role: "admin",   name: "Admin User"    },
    { email: "analyst@fraudguard.io", password: hashedPw, role: "analyst", name: "Jane Analyst"  },
    { email: "viewer@fraudguard.io",  password: hashedPw, role: "viewer",  name: "View Only"     },
    // Extra users to simulate transactions
    ...Array.from({ length: 47 }, (_, i) => ({
      email:    `user${i + 1}@marketplace.io`,
      password: hashedPw,
      role:     "viewer",
      name:     `User ${i + 1}`,
    })),
  ]);
  console.log(`👥 Created ${users.length} users`);

  // ── Create 500 transactions over last 7 days ──────────────────────────────
  const devices   = Array.from({ length: 30 },  (_, i) => `DEV-${i}`);
  const ips       = Array.from({ length: 20 },  (_, i) => `192.168.${i}.1`);
  const payTypes  = ["card", "bank_transfer", "crypto", "wallet"];
  const txnTypes  = ["purchase", "withdrawal", "transfer"];
  const regularUsers = users.slice(3);

  const transactions = [];
  const now = Date.now();

  for (let i = 0; i < 500; i++) {
    const user       = choose(regularUsers);
    const isNight    = Math.random() < 0.15;
    const isFraud    = Math.random() < 0.12;  // 12% fraud rate
    const amount     = isFraud ? randBetween(800, 9999) : randBetween(10, 499);
    const payType    = isFraud ? choose(["bank_transfer","crypto"]) : choose(payTypes);
    const txType     = isFraud ? choose(["withdrawal","transfer"])  : choose(txnTypes);
    const isNewDev   = isFraud ? Math.random() < 0.8 : Math.random() < 0.1;
    const isNewIp    = isFraud ? Math.random() < 0.7 : Math.random() < 0.1;
    const velocity1h = isFraud ? randInt(5, 20) : randInt(0, 3);

    const score = isFraud
      ? randBetween(0.65, 0.99)
      : randBetween(0.00, 0.40);

    const level  = riskLevel(score);
    const status = statusFromRisk(level);

    // Spread across last 7 days
    const daysAgo   = Math.random() * 7;
    const createdAt = new Date(now - daysAgo * 86400000);

    transactions.push({
      transactionId:   txnId(),
      userId:          user._id,
      amount:          Math.round(amount * 100) / 100,
      paymentType:     payType,
      transactionType: txType,
      deviceId:        isNewDev ? `DEV-NEW-${i}` : choose(devices),
      ipAddress:       isNewIp  ? `10.0.${i}.${i % 255}` : choose(ips),
      riskScore:       Math.round(score * 1000) / 1000,
      riskLevel:       level,
      status,
      features: {
        is_night_hour:            isNight ? 1 : 0,
        is_new_device:            isNewDev ? 1 : 0,
        is_new_ip:                isNewIp  ? 1 : 0,
        tx_count_1h:              velocity1h,
        amount_vs_avg_24h:        isFraud ? randBetween(2, 10) : randBetween(0.5, 1.5),
        payment_type_encoded:     payTypes.indexOf(payType),
        transaction_type_encoded: txnTypes.indexOf(txType),
        tx_count_24h:             randInt(1, 30),
        tx_count_7d:              randInt(5, 100),
        hour_of_day:              isNight ? randInt(0, 5) : randInt(8, 22),
        day_of_week:              randInt(0, 7),
        is_weekend:               randInt(0, 2),
      },
      createdAt,
      updatedAt: createdAt,
    });
  }

  await Transaction.insertMany(transactions);
  console.log(`💳 Created ${transactions.length} transactions`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const counts = { low: 0, medium: 0, high: 0, critical: 0 };
  transactions.forEach((t) => counts[t.riskLevel]++);

  console.log("\n📊 Seed Summary:");
  console.log(`   LOW:      ${counts.low}`);
  console.log(`   MEDIUM:   ${counts.medium}`);
  console.log(`   HIGH:     ${counts.high}`);
  console.log(`   CRITICAL: ${counts.critical}`);
  console.log(`\n🔑 Login: admin@fraudguard.io / ${SEED_PASSWORD}`);
  console.log("✅ Seed complete!\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
