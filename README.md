# FraudGuard — Intelligent Fraud Prevention Platform

## Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS + Redux Toolkit + Recharts + Socket.io-client
- **Backend**: Node.js + Express + MongoDB (Mongoose) + Redis + Socket.io
- **ML Service**: Python Flask + scikit-learn + PyTorch (GNN) + SHAP
- **DevOps**: Docker Compose + NGINX reverse proxy

---

## Quick Start

### 1. Clone and configure
```bash
git clone <your-repo>
cd fraud-prevention-platform
cp backend/.env.example backend/.env   # edit if needed
```

### 2. Run with Docker (recommended)
```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- ML Service: http://localhost:8000

### 3. Seed the database
```bash
cd database/seeds
npm install uuid bcryptjs mongoose dotenv
node run.js
```

### 4. Login credentials (after seeding)
| Role     | Email                       | Password       |
|----------|-----------------------------|----------------|
| Admin    | admin@fraudguard.io         | Admin@1234     |
| Analyst  | analyst@fraudguard.io       | Analyst@1234   |

---

## Run Locally (without Docker)

### Backend
```bash
cd backend
npm install
npm run dev     # runs on port 5000
```

### ML Service
```bash
cd ml-service
pip install -r requirements.txt
python run.py   # runs on port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # runs on port 3000
```

---

## API Reference

### Auth
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| POST   | /api/auth/register    | Register analyst  |
| POST   | /api/auth/login       | Login             |
| GET    | /api/auth/me          | Get current user  |

### Transactions
| Method | Endpoint                         | Description              |
|--------|----------------------------------|--------------------------|
| POST   | /api/transactions/ingest         | Ingest + score a txn     |
| GET    | /api/transactions                | List all (paginated)     |
| GET    | /api/transactions/stats/summary  | Dashboard KPIs           |
| GET    | /api/transactions/:id            | Get single transaction   |
| PATCH  | /api/transactions/:id/review     | Analyst review decision  |

### Fraud Intelligence
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| GET    | /api/fraud/high-risk-users  | Users by risk score   |
| GET    | /api/fraud/trend            | Daily trend (7/30d)   |
| GET    | /api/fraud/distribution     | Risk level breakdown  |

### Cases
| Method | Endpoint       | Description        |
|--------|----------------|--------------------|
| POST   | /api/cases     | Create fraud case  |
| GET    | /api/cases     | List all cases     |
| GET    | /api/cases/:id | Get case detail    |
| PATCH  | /api/cases/:id | Update case status |

### Graph
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/graph/user/:userId     | Entity relationship graph|
| GET    | /api/graph/fraud-rings      | Detected fraud rings     |

### ML Service
| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| POST   | /predict          | Score a transaction      |
| POST   | /graph-predict    | GNN-based ring scoring   |
| POST   | /train            | Retrain with feedback    |
| GET    | /health           | Service health check     |

---

## Folder Structure
```
fraud-prevention-platform/
├── backend/                  # Node.js + Express API
│   └── src/
│       ├── controllers/      # Request handlers
│       ├── models/           # Mongoose schemas
│       ├── routes/           # Express routers
│       ├── middlewares/      # Auth, error handling
│       ├── services/         # ML caller, Graph, Redis
│       ├── utils/            # Feature extractor, risk engine
│       └── config/           # DB and Redis connections
├── ml-service/               # Flask ML microservice
│   ├── app/
│   │   ├── routes/           # /predict, /graph-predict
│   │   └── services/         # Feature engineering, GNN, SHAP
│   ├── data/                 # Raw and processed datasets
│   └── notebooks/            # Training notebooks
├── frontend/                 # React + Vite SPA
│   └── src/
│       ├── components/       # Dashboard, Graph, Cases, Transactions
│       ├── pages/            # Route-level page components
│       ├── context/          # Auth and Socket contexts
│       ├── store/            # Redux Toolkit slices
│       └── services/         # Axios API layer
├── database/seeds/           # MongoDB seed data (500 txns, 50 users)
├── docker/                   # Dockerfiles + NGINX config
└── docker-compose.yml        # Full stack orchestration
```

---

## ML Model Training

Once you have labeled data, retrain the model:
```bash
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{"records": [{"amount": 500, "hour_of_day": 2, ..., "is_fraud": 1}, ...]}'
```
Use the IEEE-CIS Fraud Detection dataset from Kaggle for production training.

---

## Evaluation Metrics Addressed
- End-to-end working project (full MERN + Flask stack)
- Real-time fraud scoring with behavioral + graph intelligence
- Analyst dashboard with case management and live alerts
- Explainable AI (SHAP feature importance)
- Docker deployment ready
- Continuous learning via /train endpoint

