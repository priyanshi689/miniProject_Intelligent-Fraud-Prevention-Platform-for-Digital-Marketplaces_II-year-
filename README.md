# 🛡️ Fraud Intelligence System
### Intelligent Fraud Prevention Platform for Digital Marketplaces Using Behavioral & Graph Intelligence

![Status](https://img.shields.io/badge/Status-Live-brightgreen) ![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Flask%20%2B%20ML-blue) ![DB](https://img.shields.io/badge/Database-MongoDB%20Atlas-green) ![Deploy](https://img.shields.io/badge/Deploy-Vercel%20%2B%20Render-purple)

---

## 🌐 Live URLs

| Service | URL |
|---|---|
| 🌐 Frontend Dashboard | https://fraud-frontend-azure.vercel.app |
| ⚙️ Backend REST API | https://fraud-backend-lb7d.onrender.com |
| 🍃 Database | MongoDB Atlas (fraud-cluster.wercgzt.mongodb.net) |

**Demo Login:**
- Analyst: `analyst@fraudguard.io` / `Analyst@1234`
- Admin: `admin@fraudguard.io` / `Admin@1234`

---

## 📌 Project Info

| Field | Details |
|---|---|
| University | GLA University, Mathura |
| Department | Computer Science Engineering & Applications |
| Semester | B.Tech CSE — II Year, IV Sem (2025-26) |
| Project ID | Project 99 |

---

## 🧠 What This Project Does

An AI-powered fraud prevention platform that detects fraudulent transactions in digital marketplaces using **two AI layers**:

1. **Behavioral ML Model** (Gradient Boosting Classifier) — Detects anomalies in individual user transaction patterns using 13 engineered features
2. **Graph Neural Network (GNN)** — Maps relationships between users, devices, IPs, and payment instruments to uncover coordinated fraud rings

### Decision Engine
```
Risk Score 0.85 - 1.00  →  🔴 AUTO-BLOCK  (critical)
Risk Score 0.65 - 0.84  →  🟡 FLAG        (analyst review required)
Risk Score 0.40 - 0.64  →  🟠 REVIEW      (soft queue)
Risk Score 0.00 - 0.39  →  🟢 APPROVE     (auto-approved)
```

---

## 🏗️ Full Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React.js | 18.2.0 | SPA UI Framework |
| Vite | 5.0.6 | Build tool (100x faster than CRA) |
| TailwindCSS | 3.3.6 | Utility-first dark theme styling |
| Redux Toolkit | 2.0.1 | Centralized state management |
| Recharts | 2.10.1 | Fraud trend & distribution charts |
| Socket.io-client | 4.6.1 | Real-time fraud alerts |
| React Router v6 | 6.20.0 | Protected client-side routing |
| Axios | 1.6.2 | HTTP client with JWT interceptors |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Non-blocking I/O runtime |
| Express.js | 4.18.2 | REST API framework |
| MongoDB + Mongoose | 7.0 + 8.0 | Primary database + ODM |
| Redis | 7.2 | Risk score caching (sub-ms reads) |
| Socket.io | 4.6.1 | Real-time WebSocket alerts |
| JWT | 9.0.2 | Stateless authentication |
| bcryptjs | 2.4.3 | Password hashing (cost=12) |
| Helmet.js | 7.1.0 | Security headers |
| express-rate-limit | 7.1.5 | API abuse prevention |

### ML Service (Python Flask Microservice)
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | ML runtime |
| Flask | 3.0.0 | Lightweight ML API server |
| scikit-learn | 1.3.2 | Gradient Boosting Classifier |
| PyTorch Geometric | 2.4.0 | Graph Neural Network |
| SHAP | 0.44.0 | Explainability (feature importance) |
| NumPy | 1.26.2 | Feature vector computation |
| Pandas | 2.1.4 | Feature engineering pipelines |
| joblib | 1.3.2 | Model serialization (.pkl) |
| Gunicorn | 21.2.0 | Production WSGI server |

### DevOps & Cloud
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Full stack local orchestration |
| NGINX | Reverse proxy (API routing + WebSocket) |
| Vercel | Frontend hosting + Edge CDN |
| Render.com | Backend + ML service hosting |
| MongoDB Atlas M0 | Free cloud database (512MB) |
| GitHub Actions | CI/CD pipeline |

---

## 🤖 ML Model Details

### 13 Behavioral Features
| Feature | Fraud Signal |
|---|---|
| amount | Very high amounts = suspicious |
| is_night_hour | Transactions at 0-5am = higher risk |
| is_new_device | Never-seen device = account takeover signal |
| is_new_ip | New IP = location anomaly |
| tx_count_1h | High velocity in 1 hour = fraud ring behavior |
| amount_vs_avg_24h | Amount >> 24h average = suspicious spike |
| payment_type_encoded | Bank transfer/crypto = higher risk |
| tx_count_24h | 24-hour velocity baseline |
| tx_count_7d | 7-day velocity pattern |
| hour_of_day | Time of day (0-23) |
| day_of_week | Day of week pattern |
| is_weekend | Weekend fraud spike indicator |
| transaction_type_encoded | withdrawal/transfer > purchase risk |

### Graph Risk Boost Formula
```
graph_boost = shared_device(0.25) + shared_ip(0.20) + shared_instrument(0.20) + fraud_ring(0.35)
final_score = min(behavioral_score + graph_boost, 1.0)
```

---

## 📁 Folder Structure

```
fraud-prevention-platform/
├── backend/                          # Node.js + Express API (Port 5000)
│   └── src/
│       ├── controllers/              # auth, transaction, fraud, case, graph
│       ├── models/                   # User, Transaction, FraudCase, Device, RiskScore
│       ├── routes/                   # Express route definitions
│       ├── middlewares/              # JWT auth, error handler, rate limiter
│       ├── services/                 # mlService.js, graphService.js, redisService.js
│       └── utils/                   # featureExtractor.js, riskEngine.js
├── ml-service/                       # Flask ML Microservice (Port 8000)
│   └── app/
│       ├── routes/predict.py         # /predict endpoint (GBC model)
│       ├── routes/graph_predict.py   # /graph-predict endpoint (GNN)
│       └── services/                 # feature_engineering, gnn_inference, explainability
├── frontend/                         # React + Vite SPA (Port 3000)
│   └── src/
│       ├── pages/                    # Dashboard, Transactions, Cases, GraphView, Analytics
│       ├── components/               # RiskOverview, FraudTrendChart, LiveAlertFeed
│       ├── context/                  # AuthContext, SocketContext
│       ├── store/                    # Redux fraudSlice
│       └── services/api.js           # Axios API layer
├── database/seeds/run.js             # MongoDB seed: 50 users, 500 txns, 3 cases
├── docker/                           # Dockerfiles + NGINX config
└── docker-compose.yml                # Full stack in one command
```

---

## 🔌 Complete API Reference

### Authentication
```
POST /api/auth/register     Create analyst/admin account
POST /api/auth/login        Login → JWT token
GET  /api/auth/me           Get current user (JWT required)
```

### Transactions
```
POST  /api/transactions/ingest         Submit transaction for ML scoring
GET   /api/transactions                List all (paginated, filterable)
GET   /api/transactions/stats/summary  Dashboard KPIs
GET   /api/transactions/:id            Single transaction + ML explanation
PATCH /api/transactions/:id/review     Analyst review decision
```

### Fraud Intelligence
```
GET /api/fraud/high-risk-users   Users sorted by risk score
GET /api/fraud/trend             Daily trend data (7 or 30 days)
GET /api/fraud/distribution      Risk level breakdown chart data
```

### Graph
```
GET /api/graph/user/:userId   Entity relationship graph
GET /api/graph/fraud-rings    All detected fraud ring clusters
```

### Cases
```
POST  /api/cases        Create fraud investigation case
GET   /api/cases        List cases (filter by status/priority)
GET   /api/cases/:id    Case detail + timeline
PATCH /api/cases/:id    Update status, assign analyst
```

### ML Service (Port 8000)
```
POST /predict         Score transaction (behavioral GBC model)
POST /graph-predict   GNN fraud ring detection
POST /train           Retrain model with analyst feedback
GET  /health          Service health check
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+ | Python 3.11+ | MongoDB 7.0 | Git

### Steps
```bash
# 1. Clone
git clone https://github.com/priyanshi689/miniProject_Intelligent-Fraud-Prevention...

# 2. Start MongoDB
net start MongoDB  # Windows

# 3. Backend (Terminal 1)
cd backend && npm install && npm run dev

# 4. Frontend (Terminal 2)
cd frontend && npm install && npm run dev

# 5. ML Service (Terminal 3)
cd ml-service && pip install -r requirements.txt && python run.py

# 6. Seed database (run once)
cd database/seeds && node run.js

# 7. Open http://localhost:3000
```

### Docker (One command)
```bash
docker compose up --build
```

---

## 🔐 Security
- JWT authentication with 7-day expiry
- bcrypt password hashing (cost factor 12)
- Role-based access control (admin/analyst/viewer)
- Helmet.js security headers
- CORS restricted to frontend domain
- Rate limiting: 200 req/15min per IP
- Input validation on all mutation endpoints

---

## 🔮 Future Scope
- Reinforcement learning for enforcement optimization
- Apache Kafka for 1M+ TPS real-time streaming
- Mobile app (React Native) for analyst alerts
- Cross-platform fraud intelligence sharing
- Federated learning for privacy-preserving model training

---

*Built with intelligence at GLA University, Mathura | 2025-26*
