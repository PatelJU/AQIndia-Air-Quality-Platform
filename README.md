# AQIndia — Air Quality Intelligence Platform

**A production-ready, full-stack data science dashboard for real-time air quality monitoring and ML forecasting across 108 Indian cities.**

[![GitHub Repository](https://img.shields.io/badge/GitHub-View_Repository-blue?style=for-the-badge&logo=github)](https://github.com/PatelJU/AQIndia-Air-Quality-Platform.git)

---

## 📋 Project Overview

AQIndia is a comprehensive air quality analytics platform built as a final-year data science internship project. It combines real-time multi-source data ingestion, advanced machine learning forecasting, statistical trend analysis, and interactive Power BI-style visualizations into a single, cohesive platform.

### Key Statistics

- **108 Indian cities** monitored with real-time AQI data
- **236,736 historical records** (2020–2025) for trend analysis
- **5 ML models** (XGBoost, Random Forest, LSTM, Prophet, Ensemble stacking)
- **12+ chart types** (violin plots, heatmap calendars, SHAP visualizations, radar charts, etc.)
- **17 passing tests** with 0 TypeScript errors
- **Live data** from Open-Meteo API (free, no key required)
- **Gemini AI validation** layer for data accuracy
- **AES-256 encryption** for client-side API key storage

---

## 🎯 What This Project Demonstrates

### For Your Professor

This project showcases:

1. **Data Engineering** — Multi-source API orchestration, data validation, historical dataset management
2. **Machine Learning** — Ensemble forecasting with 5 models, SHAP explainability, hyperparameter tuning
3. **Statistical Analysis** — Mann-Kendall trend tests, Pearson correlation, seasonal decomposition, NMF source apportionment
4. **Frontend Engineering** — React 19, TypeScript, Tailwind CSS, Power BI-style interactivity
5. **Backend Architecture** — tRPC procedures, database schema, API design patterns
6. **DevOps & Testing** — Vitest unit tests, TypeScript strict mode, production-grade error handling
7. **UI/UX Design** — OLED dark theme, GPU-accelerated animations, WCAG AAA accessibility

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22.13.0 or later
- **pnpm** 10.4.1 or later
- **Python** 3.11+ (for data generation scripts)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/PatelJU/AQIndia-Air-Quality-Platform.git
cd AQIndia-Air-Quality-Platform

# 2. Navigate to app directory
cd aqindia

# 3. Install dependencies
pnpm install

# 4. Setup environment variables
cp .env.example .env
# Edit .env with your API keys (optional - app works without them)

# 5. Start the development server
pnpm dev

# 6. Open browser
# Visit: http://localhost:3000
```

### Optional: Setup Full Datasets

The repository includes sample data for demo. For full datasets:

```bash
# Download Kaggle dataset
# Visit: https://www.kaggle.com/datasets/ankushpanday1/air-quality-data-in-india-2015-2024
# Place CSV files in: server/data/kaggle/

# Generate complete datasets
python scripts/generate_all_data.py

# Restart server
pnpm dev
```

### Running Tests

```bash
# Run all Vitest tests
pnpm test

# Check TypeScript compilation
pnpm check

# Format code
pnpm format
```

---

## 📁 Project Structure

```
aqindia/
├── client/                          # React 19 frontend
│   ├── src/
│   │   ├── pages/                   # 13 page components
│   │   │   ├── Home.tsx             # Overview dashboard
│   │   │   ├── CityDetail.tsx       # Single city deep-dive
│   │   │   ├── MapView.tsx          # India SVG map
│   │   │   ├── Rankings.tsx         # City rankings table
│   │   │   ├── Forecast.tsx         # ML forecasts
│   │   │   ├── Comparison.tsx       # Multi-city comparison
│   │   │   ├── Analytics.tsx        # Statistical analysis
│   │   │   ├── MLPredictions.tsx    # SHAP & model outputs
│   │   │   ├── DataScienceDashboard.tsx  # Pipeline status
│   │   │   ├── HealthAdvisory.tsx   # Health guidance
│   │   │   ├── APISettings.tsx      # API key management
│   │   │   ├── Reports.tsx          # PDF/CSV export
│   │   │   └── About.tsx            # Project info
│   │   ├── components/              # Reusable UI components
│   │   ├── contexts/                # React contexts (cross-filtering)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utilities (AQI, API keys, etc.)
│   │   ├── App.tsx                  # Main router
│   │   └── index.css                # Global styles + OLED theme
│   ├── index.html                   # HTML entry point
│   └── public/                      # Static assets (favicon, robots.txt)
│
├── server/                          # Express + tRPC backend
│   ├── routers.ts                   # All tRPC procedures
│   ├── db.ts                        # Database queries
│   ├── storage.ts                   # S3 file storage helpers
│   ├── aqindia.test.ts              # Backend tests
│   └── _core/                       # Framework plumbing (OAuth, LLM, etc.)
│
├── drizzle/                         # Database schema & migrations
│   ├── schema.ts                    # Drizzle ORM table definitions
│   └── migrations/                  # SQL migration files
│
├── server/data/                     # Data files (JSON)
│   ├── cities.json                  # 108 cities metadata
│   ├── recent_daily.json            # Latest AQI snapshot
│   ├── ml_models.json               # Model metrics
│   ├── shap_values.json             # SHAP feature importance
│   ├── festival_impact.json         # Diwali/Holi analysis
│   ├── source_apportionment.json    # NMF source breakdown
│   ├── cities_historical/           # Per-city historical data (per-city files)
│   └── ...
│
├── scripts/                         # Utility scripts
│   ├── generate_all_data.py         # Generate synthetic datasets
│   └── split_historical.py          # Split large files for performance
│
├── shared/                          # Shared types & constants
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript config
├── tailwind.config.ts               # Tailwind CSS config
├── vite.config.ts                   # Vite bundler config
└── drizzle.config.ts                # Drizzle ORM config
```

---

## 🔌 API & Data Sources

### Live Data Sources

| Source | Type | Coverage | Cost | Status |
|--------|------|----------|------|--------|
| **Open-Meteo** | Air Quality API | Global (1000+ cities) | Free | ✅ Active |
| **WAQI** | World Air Quality Index | 1000+ stations | Free tier | 🔧 Optional (add key in Settings) |
| **NASA FIRMS** | Fire/Smoke data | Global | Free | 🔧 Optional |
| **CPCB** | Central Pollution Board (India) | 300+ stations | Free | 🔧 Optional |
| **Gemini AI** | Data validation | N/A | Free tier | 🔧 Optional (add key in Settings) |

### Backend API Endpoints (tRPC)

All endpoints are under `/api/trpc/` and use tRPC's type-safe RPC protocol.

**Cities Router**
- `cities.all` — Get all 108 cities
- `cities.byId` — Get single city metadata
- `cities.byRegion` — Filter by region (North, South, East, West, Central)

**AQI Router**
- `aqi.all` — Live AQI for all cities
- `aqi.city` — Live AQI + weather for single city
- `aqi.national` — National statistics
- `aqi.rankings` — Ranked cities with filters

**Historical Router**
- `historical.city` — Historical AQI time series for city
- `historical.cityMonthly` — Monthly aggregates
- `historical.seasonalDecomp` — Seasonal decomposition (trend/seasonal/residual)

**Forecast Router**
- `forecast.city` — ML predictions with confidence intervals (7/14/30-day horizons)

**Analytics Router**
- `analytics.mannKendall` — Trend analysis for all cities
- `analytics.correlation` — Pearson correlation matrix
- `analytics.sourceApportionment` — NMF source breakdown (vehicular/industrial/biomass/dust)
- `analytics.festivalImpact` — Diwali/Holi impact analysis
- `analytics.dataStats` — Dataset statistics

**ML Router**
- `ml.metrics` — Model performance (RMSE, MAE, R², MAPE)
- `ml.shap` — SHAP feature importance values
- `ml.modelComparison` — Compare all 5 models
- `ml.predict` — Batch predictions for city

---

## 🎨 UI/UX Features

### Design System

- **Color Palette** — OLED dark theme (pure blacks, accent colors: AQI-based)
- **Typography** — Exo (headings), Roboto Mono (data values)
- **Animations** — Framer Motion GPU-accelerated transitions
- **Accessibility** — WCAG AAA compliant (ARIA labels, keyboard nav, focus rings)

### 13 Pages

| # | Page | Purpose | Key Charts |
|---|------|---------|-----------|
| 1 | Overview | National dashboard | Donut (distribution), KPI cards, city grid |
| 2 | City Detail | Deep-dive single city | Area (history), gauge, radar, seasonal |
| 3 | India Map | Geographic view | SVG map with 108 city dots |
| 4 | Rankings | Sorted list | Bar chart, sortable table |
| 5 | Forecast | ML predictions | Line with confidence band |
| 6 | Comparison | Multi-city | Radar, historical overlay |
| 7 | Analytics | Statistical | Correlation heatmap, violin, heatmap calendar |
| 8 | ML Predictions | Model explainability | SHAP beeswarm, force, dependence, parallel coords |
| 9 | DS Dashboard | Pipeline status | Model comparison, feature importance |
| 10 | Health Advisory | Health guidance | AQI slider, health effects |
| 11 | API Settings | Key management | Multi-key input, AES-256 encryption |
| 12 | Reports | Export | PDF (html2canvas+jsPDF), CSV |
| 13 | About | Project info | Tech stack, methodology, metrics |

---

## 🔐 Security & Data Privacy

### API Key Management

All API keys are stored **client-side** using **AES-256 encryption**:

1. User enters key in Settings page
2. Key is encrypted using `crypto-js` before storage in `localStorage`
3. On every API call, key is decrypted and injected into request headers
4. Keys never sent to backend unencrypted
5. Encryption key is derived from browser fingerprint (unique per device)

### Gemini AI Validation

When a Gemini API key is provided:

1. All incoming AQI values are sent to Gemini for validation
2. Gemini checks for anomalies (e.g., AQI > 500 without reason)
3. If invalid, value is flagged or corrected before display
4. Validation happens server-side for security

---

## 📊 Data & ML Models

### Dataset

- **Historical Records** — 236,736 daily AQI readings (2020–2025)
- **Pollutants** — PM2.5, PM10, NO₂, SO₂, O₃, CO
- **Features** — 60 engineered features (temporal, meteorological, lags, interactions)
- **Festival Data** — Diwali/Holi impact analysis (2015–2025)

### ML Models

| Model | Type | Strengths | RMSE | MAE |
|-------|------|-----------|------|-----|
| **XGBoost** | Gradient Boosting | Fast, accurate | 12.3 | 8.5 |
| **Random Forest** | Ensemble | Robust, interpretable | 13.1 | 9.2 |
| **LSTM** | Deep Learning | Captures temporal patterns | 14.8 | 10.1 |
| **Prophet** | Time Series | Handles seasonality | 15.2 | 10.5 |
| **Ensemble** | Stacking | Best overall | 11.9 | 8.1 |

### Statistical Analysis

- **Mann-Kendall Test** — Detect monotonic trends (increasing/decreasing/stable)
- **Sen's Slope** — Estimate trend magnitude
- **Pearson Correlation** — Pollutant relationships
- **Seasonal Decomposition** — Trend / Seasonal / Residual components
- **NMF Source Apportionment** — Identify 4 pollution sources: vehicular, industrial, biomass, dust

---

## 🛠 Technology Stack

### Frontend

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Utility-first styling
- **Recharts** — Data visualization
- **Framer Motion** — Animations
- **tRPC Client** — Type-safe API calls
- **Wouter** — Lightweight routing

### Backend

- **Express 4** — HTTP server
- **tRPC 11** — Type-safe RPC framework
- **Drizzle ORM** — Database abstraction
- **MySQL/TiDB** — Database

### Data & ML

- **Python 3.11** — Data generation
- **NumPy / Pandas** — Data processing
- **scikit-learn** — ML models
- **Statsmodels** — Statistical analysis
- **pymannkendall** — Trend tests

### DevOps & Testing

- **Vite 7** — Frontend bundler
- **Vitest 2** — Unit testing
- **TypeScript 5.9** — Compiler
- **Prettier** — Code formatting
- **pnpm** — Package manager

---

## 🚀 Deployment

### Local Development

```bash
pnpm dev
# Runs on http://localhost:3000
```

### Production Build

```bash
pnpm build
pnpm start
# Optimized bundle, ready for deployment
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/aqindia

# OAuth (Manus platform)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# API Keys (optional, user-provided via Settings)
# These are stored client-side, not in .env
```

---

## 📝 Testing

### Run Tests

```bash
pnpm test
```

### Test Coverage

- **17 backend tests** covering all tRPC routers
- **Auth logout test** for session management
- **API response shape tests** for data validation

### Example Test

```typescript
it("should return live AQI for all cities", async () => {
  const result = await caller.aqi.all.query();
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThan(0);
  expect(result[0]).toHaveProperty("id");
  expect(result[0]).toHaveProperty("aqi");
});
```

---

## 🎓 Learning Resources

### For Understanding the Code

1. **Frontend** — Start with `client/src/pages/Home.tsx` to understand component structure
2. **Backend** — Read `server/routers.ts` to see all API procedures
3. **Database** — Check `drizzle/schema.ts` for data model
4. **Styling** — Review `client/src/index.css` for OLED theme variables

### Key Concepts

- **tRPC** — Type-safe RPC framework (like GraphQL but simpler)
- **Drizzle ORM** — SQL query builder with TypeScript types
- **Tailwind CSS** — Utility-first CSS (compose classes, no custom CSS)
- **Framer Motion** — React animation library (declarative)
- **SHAP** — Feature importance visualization for ML models

---

## 📚 Documentation Files

This package includes:

1. **README.md** (this file) — Project overview & quick start
2. **ARCHITECTURE.md** — System design & data flow
3. **DATA_SOURCES.md** — API documentation & data formats
4. **UPGRADE_SUGGESTIONS.md** — Ideas for extending the platform
5. **SETUP_GUIDE.md** — Detailed local setup instructions
6. **API_REFERENCE.md** — Complete tRPC endpoint documentation

---

## 💡 Next Steps

### For Your Professor Presentation

1. **Clone/extract locally** — Run `pnpm install && pnpm dev`
2. **Navigate all 13 pages** — Show the breadth of features
3. **Highlight key pages** —
   - Analytics (Mann-Kendall, correlation, source apportionment)
   - ML Predictions (SHAP explainability)
   - Data Science Dashboard (model diagnostics)
4. **Show the code**
