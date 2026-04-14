# AQIndia — System Architecture

Complete technical overview of AQIndia's architecture, data flow, and design decisions.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 19 + TypeScript + Tailwind CSS               │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  13 Pages (Home, City Detail, Map, etc.)   │    │   │
│  │  │  - Power BI-style cross-filtering          │    │   │
│  │  │  - 12+ chart types (Recharts)              │    │   │
│  │  │  - Framer Motion animations                │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  tRPC Client                                │    │   │
│  │  │  - Type-safe API calls                      │    │   │
│  │  │  - Automatic caching                        │    │   │
│  │  │  - Real-time updates                        │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  Local Storage (AES-256 encrypted)          │    │   │
│  │  │  - API keys (WAQI, Gemini, etc.)           │    │   │
│  │  │  - User preferences                         │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/tRPC
┌─────────────────────────────────────────────────────────────┐
│              Node.js Server (Backend)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express 4 + tRPC 11                                │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  tRPC Routers (API Procedures)              │    │   │
│  │  │  - cities, aqi, forecast, analytics, ml     │    │   │
│  │  │  - Each router = type-safe RPC endpoint     │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  Data Pipeline                              │    │   │
│  │  │  - Fetch live AQI (Open-Meteo, WAQI, etc.) │    │   │
│  │  │  - Validate with Gemini AI (if key provided)    │   │
│  │  │  - Compute statistics (Mann-Kendall, etc.)      │   │
│  │  │  - Generate ML forecasts                    │    │   │
│  │  │  - Cache results                            │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  Database (Drizzle ORM)                     │    │   │
│  │  │  - Users, API keys, alerts, reports        │    │   │
│  │  │  - MySQL/TiDB backend                      │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│              External APIs & Data Sources                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Open-Meteo Air Quality API (Free)                  │   │
│  │  - Real-time AQI, PM2.5, PM10, NO₂, SO₂, O₃, CO    │   │
│  │  - Weather data (temp, humidity, wind)             │   │
│  │                                                      │   │
│  │  WAQI API (Optional, user-provided key)            │   │
│  │  - 1000+ Indian air quality stations               │   │
│  │                                                      │   │
│  │  Gemini AI API (Optional, user-provided key)       │   │
│  │  - Validates AQI data for anomalies               │   │
│  │                                                      │   │
│  │  NASA FIRMS (Optional)                             │   │
│  │  - Fire/smoke data overlay                         │   │
│  │                                                      │   │
│  │  Local JSON Data Files                             │   │
│  │  - Historical AQI (236,736 records)                │   │
│  │  - ML model metrics                                │   │
│  │  - Festival impact data                            │   │
│  │  - SHAP feature importance                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. User Visits Home Page

```
Browser → tRPC Call: aqi.all
  ↓
Express Server receives request
  ↓
Check cache (in-memory)
  ↓
If cache miss:
  ├─ Fetch live data from Open-Meteo
  ├─ If user provided WAQI key: fetch from WAQI (fallback)
  ├─ If user provided Gemini key: validate each AQI value
  ├─ Compute statistics (national avg, rankings, etc.)
  └─ Cache result (5-minute TTL)
  ↓
Return to browser
  ↓
React renders 108 city cards with live AQI
```

### 2. User Clicks on Delhi (City Detail)

```
Browser → tRPC Call: aqi.city({ cityId: "delhi" })
  ↓
Express Server:
  ├─ Fetch live AQI + weather for Delhi
  ├─ Load historical data from cities_historical/delhi.json
  ├─ Compute Mann-Kendall trend
  ├─ Compute seasonal decomposition
  └─ Return all data
  ↓
React renders:
  ├─ Live AQI gauge
  ├─ Pollutant bars
  ├─ Historical area chart
  ├─ Radar chart (pollutants)
  ├─ Seasonal decomposition
  └─ Mann-Kendall analysis
```

### 3. User Navigates to ML Predictions

```
Browser → tRPC Call: ml.predict({ cityId: "delhi", model: "ensemble" })
  ↓
Express Server:
  ├─ Load ensemble model metrics
  ├─ Load SHAP values for ensemble
  ├─ Generate 14-day forecast
  └─ Return predictions + confidence intervals
  ↓
React renders:
  ├─ Line chart with confidence band
  ├─ SHAP beeswarm plot
  ├─ SHAP force plot
  ├─ SHAP dependence plot
  ├─ Parallel coordinates
  └─ Model comparison table
```

---

## Component Architecture

### Frontend Components

```
App.tsx (Router)
├── AQIDashboardLayout (Sidebar + Main)
│   ├── Sidebar Navigation
│   │   ├── MAIN (Overview, Map, Rankings)
│   │   ├── ANALYSIS (Forecast, Comparison, Analytics)
│   │   ├── DATA SCIENCE (ML Predictions, DS Dashboard)
│   │   └── INSIGHTS (Health Advisory, Reports, About)
│   │
│   └── Main Content Area
│       ├── Home.tsx
│       ├── CityDetail.tsx
│       ├── MapView.tsx
│       ├── Rankings.tsx
│       ├── Forecast.tsx
│       ├── Comparison.tsx
│       ├── Analytics.tsx
│       ├── MLPredictions.tsx
│       ├── DataScienceDashboard.tsx
│       ├── HealthAdvisory.tsx
│       ├── APISettings.tsx
│       ├── Reports.tsx
│       └── About.tsx

Shared Components
├── DashboardLayout (Sidebar + Layout)
├── Charts (Recharts wrappers)
├── Cards (KPI, Data cards)
├── Tables (Sortable, filterable)
└── Forms (Input, Select, etc.)

Contexts
├── CrossFilterContext (City selection propagation)
├── ThemeContext (Dark/Light theme)
└── AuthContext (User session)

Hooks
├── useAuth() (Current user)
├── useCrossFilter() (City selection)
└── useLocalStorage() (Persist settings)

Utilities
├── lib/aqi.ts (AQI categories, colors)
├── lib/apiKeys.ts (AES-256 encryption)
├── lib/trpc.ts (tRPC client setup)
└── lib/utils.ts (General utilities)
```

### Backend Procedures

```
appRouter
├── cities
│   ├── all() → [City]
│   ├── byId(id) → City
│   └── byRegion(region) → [City]
│
├── aqi
│   ├── all() → [CityAQI]
│   ├── city(cityId) → CityAQI
│   ├── national() → NationalStats
│   └── rankings(filters) → [RankedCity]
│
├── historical
│   ├── city(cityId, days) → [HistoricalRecord]
│   ├── cityMonthly(cityId) → [MonthlyAggregate]
│   └── seasonalDecomp(cityId) → SeasonalDecomp
│
├── forecast
│   └── city(cityId, horizon) → [Forecast]
│
├── analytics
│   ├── mannKendall() → [TrendAnalysis]
│   ├── correlation(cityId) → CorrelationMatrix
│   ├── sourceApportionment(cityId) → SourceApport
│   ├── festivalImpact(festival, cityId) → [FestivalData]
│   └── dataStats() → DatasetStats
│
├── ml
│   ├── metrics() → ModelMetrics
│   ├── shap(model) → [SHAPValue]
│   ├── modelComparison() → [ModelComparison]
│   └── predict(cityId, model, horizon) → [Prediction]
│
└── auth
    ├── me() → User
    └── logout() → { success: true }
```

---

## Data Model

### Database Schema (Drizzle ORM)

```typescript
// Users table
users {
  id: int (PK)
  openId: varchar (unique, from OAuth)
  name: varchar
  email: varchar
  role: enum('user', 'admin')
  createdAt: timestamp
  updatedAt: timestamp
  lastSignedIn: timestamp
}

// API Keys (encrypted)
api_keys {
  id: int (PK)
  userId: int (FK → users.id)
  provider: enum('waqi', 'gemini', 'nasa', 'cpcb')
  encrypted_key: text (AES-256 encrypted)
  is_active: boolean
  created_at: timestamp
  last_used: timestamp
}

// Saved Reports
saved_reports {
  id: int (PK)
  userId: int (FK → users.id)
  name: varchar
  report_type: enum('city', 'summary', 'ml')
  data: json
  created_at: timestamp
}

// User Alerts
user_alerts {
  id: int (PK)
  userId: int (FK → users.id)
  city_id: varchar
  threshold_aqi: int
  alert_type: enum('email', 'push', 'in-app')
  is_active: boolean
  created_at: timestamp
}
```

### JSON Data Files

```
server/data/
├── cities.json
│   └── [{ id, name, state, region, lat, lon, population }, ...]
│
├── recent_daily.json
│   └── [{ city_id, aqi, pm25, pm10, no2, so2, o3, co, temp, humidity, wind, source }, ...]
│
├── cities_historical/
│   ├── delhi.json
│   ├── mumbai.json
│   └── ... (one file per city)
│   └── [{ date, aqi, pm25, pm10, no2, so2, o3, co }, ...]
│
├── ml_models.json
│   └── { random_forest, lstm, xgboost, prophet, ensemble: { rmse, mae, r2, mape } }
│
├── shap_values.json
│   └── [{ feature, importance, mean_abs_shap, direction, feature_category }, ...]
│
├── festival_impact.json
│   └── [{ city_id, festival, year, before_avg, during_avg, after_avg, t_statistic, p_value }, ...]
│
├── source_apportionment.json
│   └── [{ city_id, vehicular, industrial, biomass, dust }, ...]
│
└── seasonal_decomp.json
    └── [{ city_id, date, trend, seasonal, residual }, ...]
```

---

## API Integration

### Open-Meteo Air Quality API

```
GET https://api-v2.open-meteo.com/v1/air-quality
?latitude=28.7041
&longitude=77.1025
&hourly=pm10,pm2_5,no2,so2,o3,co
&timezone=Asia/Kolkata

Response:
{
  "hourly": {
    "pm10": [120, 125, ...],
    "pm2_5": [80, 85, ...],
    ...
  }
}
```

### WAQI API (Optional)

```
GET https://api.waqi.info/feed/{city}/?token={key}

Response:
{
  "data": {
    "aqi": 137,
    "pm25": 76,
    "pm10": 118,
    ...
  }
}
```

### Gemini AI Validation

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}

Request:
{
  "contents": [{
    "parts": [{
      "text": "Validate this AQI reading: Delhi AQI=460, PM2.5=150µg/m³. Is it reasonable?"
    }]
  }]
}

Response:
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "Yes, this is reasonable for Delhi in winter..."
      }]
    }
  }]
}
```

---

## Caching Strategy

### In-Memory Cache (Server)

```typescript
// Cache structure
const cache = {
  'aqi.all': { data, timestamp, ttl: 5min },
  'aqi.city.delhi': { data, timestamp, ttl: 5min },
  'forecast.city.delhi.7d': { data, timestamp, ttl: 1hour },
  ...
}

// Cache invalidation
- On data update: clear related keys
- On TTL expiry: auto-clear
- Manual clear: admin endpoint
```

### Client-Side Cache (React Query)

```typescript
// tRPC automatically caches queries
const { data } = trpc.aqi.all.useQuery();
// Cached for 5 minutes by default

// Manual invalidation
const utils = trpc.useUtils();
utils.aqi.all.invalidate(); // Refetch
```

### Local Storage (Browser)

```typescript
// Encrypted API keys
localStorage.setItem('aq_keys', encryptedJSON)

// User preferences
localStorage.setItem('aq_prefs', JSON.stringify({
  theme: 'dark',
  selectedCity: 'delhi',
  ...
}))
```

---

## Security Architecture

### API Key Management

```
1. User enters key in Settings page
   ↓
2. Key is encrypted using AES-256
   - Encryption key = SHA256(browser fingerprint)
   - Ciphertext stored in localStorage
   ↓
3. On API call:
   - Retrieve encrypted key from localStorage
   - Decrypt using browser fingerprint
   - Inject into request header
   ↓
4. Backend receives request
   - Validates key format
   - Uses key to call external API
   - Never stores key in database
```

### Gemini AI Validation

```
1. User provides Gemini key in Settings
   ↓
2. On every AQI data fetch:
   - Extract AQI value
   - Send to Gemini for validation
   - Gemini checks for anomalies
   ↓
3. If valid:
   - Display data normally
   ↓
4. If invalid:
   - Flag as "Anomaly Detected"
   - Show confidence score
   - Suggest fallback value
```

---

## Performance Optimization

### Frontend

1. **Code Splitting** — Each page is lazy-loaded
2. **Image Optimization** — SVG maps, no large images
3. **Caching** — tRPC + React Query automatic caching
4. **Animations** — GPU-accelerated with Framer Motion
5. **Bundle Size** — ~200KB gzipped

### Backend

1. **In-Memory Cache** — 5-minute TTL for live data
2. **Per-City Data Files** — Load only needed data
3. **Database Indexes** — On city_id, date columns
4. **API Batching** — Fetch multiple cities in one request

### Data

1. **Historical Split** — One file per city (not one large file)
2. **JSON Compression** — Gzip compression for transfer
3. **Lazy Loading** — Load data on-demand

---

## Deployment Architecture

### Development

```
localhost:3000
├── Frontend (Vite dev server)
├── Backend (Express + tRPC)
└── Database (In-memory or local MySQL)
```

### Production

```
CDN
├── Static assets (JS, CSS)
└── Cached responses

Load Balancer
├── API Server 1 (Express + tRPC)
├── API Server 2 (Express + tRPC)
└── API Server N

Database
├── MySQL/TiDB cluster
└── Replicas for read scaling

External APIs
├── Open-Meteo
├── WAQI (if user provides key)
└── Gemini AI (if user provides key)
```

---

## Error Handling

### Frontend

```typescript
// tRPC error handling
const { data, error, isLoading } = trpc.aqi.all.useQuery();

if (error) {
  // Show error toast
  toast.error(error.message);
}

if (isLoading) {
  // Show skeleton
  return <Skeleton />;
}
```

### Backend

```typescript
// tRPC error types
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'City not found'
});

throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Failed to fetch from Open-Meteo'
});
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// Test API procedures
it("should return live AQI for all cities", async () => {
  const result = await caller.aqi.all.query();
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThan(0);
});
```

### Integration Tests

```typescript
// Test full data flow
it("should fetch and validate AQI with Gemini", async () => {
  // 1. Fetch live data
  // 2. Validate with Gemini
  // 3. Assert result is valid
});
```

---

## Next Steps

- Read **DATA_SOURCES.md** for API documentation
- Read **API_REFERENCE.md** for tRPC endpoints
- Read **UPGRADE_SUGGESTIONS.md** for feature ideas
