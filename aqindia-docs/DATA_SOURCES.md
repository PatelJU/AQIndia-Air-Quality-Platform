# AQIndia — Data Sources & APIs

Complete documentation of all data sources, APIs, and how to integrate them.

---

## Overview

AQIndia uses multiple data sources for real-time AQI monitoring, historical analysis, and ML forecasting. Each source has different coverage, accuracy, and cost implications.

---

## Live Data Sources

### 1. Open-Meteo Air Quality API (Default, Free)

**Status** — ✅ Active by default, no key required

**Coverage** — Global (1000+ cities), including 108 Indian cities

**Data** — Real-time hourly air quality

**Cost** — Free (10,000 requests/day limit)

**Endpoint**

```
GET https://api-v2.open-meteo.com/v1/air-quality
```

**Parameters**

```
latitude=28.7041          # City latitude
longitude=77.1025         # City longitude
hourly=pm10,pm2_5,no2,so2,o3,co  # Pollutants
timezone=Asia/Kolkata     # Timezone
```

**Response**

```json
{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "hourly": {
    "time": ["2025-04-11T00:00", "2025-04-11T01:00", ...],
    "pm10": [120, 125, 130, ...],
    "pm2_5": [80, 85, 90, ...],
    "no2": [45, 50, 55, ...],
    "so2": [15, 16, 17, ...],
    "o3": [35, 36, 37, ...],
    "co": [0.5, 0.6, 0.7, ...]
  }
}
```

**AQI Calculation**

Open-Meteo returns European AQI (0-100 scale). We convert to Indian AQI (0-500+):

```typescript
function convertOpenMeteoToIndianAQI(pm25: number): number {
  // European AQI to Indian AQI conversion
  // Indian AQI = European AQI * 5 (approximate)
  return Math.round(pm25 * 5);
}
```

**Backend Implementation**

```typescript
// server/routers.ts
async function fetchOpenMeteo(lat: number, lon: number) {
  const url = `https://api-v2.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,no2,so2,o3,co&timezone=Asia/Kolkata`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  const latest = {
    pm10: data.hourly.pm10[0],
    pm25: data.hourly.pm2_5[0],
    no2: data.hourly.no2[0],
    so2: data.hourly.so2[0],
    o3: data.hourly.o3[0],
    co: data.hourly.co[0],
  };
  
  return {
    aqi: convertOpenMeteoToIndianAQI(latest.pm25),
    ...latest,
    source: 'Open-Meteo'
  };
}
```

**Advantages**
- ✅ Free, no authentication
- ✅ Global coverage
- ✅ Reliable and fast
- ✅ Includes weather data

**Disadvantages**
- ❌ European AQI scale (needs conversion)
- ❌ Lower granularity than ground stations

---

### 2. WAQI (World Air Quality Index) — Optional

**Status** — 🔧 Optional (user provides key in Settings)

**Coverage** — 1000+ stations in India, 10,000+ worldwide

**Data** — Real-time AQI from ground stations

**Cost** — Free tier (500 requests/day), paid plans available

**Get API Key**

1. Visit [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/)
2. Sign up for free account
3. Copy your API token
4. Paste in AQIndia Settings page

**Endpoint**

```
GET https://api.waqi.info/feed/{city}/?token={key}
```

**Parameters**

```
city=delhi              # City name or station ID
token=abc123xyz        # Your API key
```

**Response**

```json
{
  "status": "ok",
  "data": {
    "aqi": 137,
    "idx": 1234,
    "city": {
      "name": "Delhi",
      "geo": [28.7041, 77.1025]
    },
    "iaqi": {
      "pm25": { "v": 76 },
      "pm10": { "v": 118 },
      "no2": { "v": 45 },
      "so2": { "v": 15 },
      "o3": { "v": 35 },
      "co": { "v": 0.5 }
    }
  }
}
```

**Backend Implementation**

```typescript
// server/routers.ts
async function fetchWAQI(cityId: string, apiKey: string) {
  const url = `https://api.waqi.info/feed/${cityId}/?token=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== 'ok') {
    throw new Error('WAQI API error');
  }
  
  return {
    aqi: data.data.aqi,
    pm25: data.data.iaqi.pm25?.v,
    pm10: data.data.iaqi.pm10?.v,
    no2: data.data.iaqi.no2?.v,
    so2: data.data.iaqi.so2?.v,
    o3: data.data.iaqi.o3?.v,
    co: data.data.iaqi.co?.v,
    source: 'WAQI'
  };
}
```

**Advantages**
- ✅ Indian AQI scale (no conversion needed)
- ✅ Ground-based measurements (more accurate)
- ✅ 1000+ Indian stations
- ✅ Real-time updates

**Disadvantages**
- ❌ Requires API key
- ❌ Rate limits (500 requests/day free tier)
- ❌ Some cities may not have stations

---

### 3. Gemini AI Validation — Optional

**Status** — 🔧 Optional (user provides key in Settings)

**Purpose** — Validate AQI data for anomalies

**Cost** — Free tier (15 requests/minute), paid plans available

**Get API Key**

1. Visit [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key
5. Paste in AQIndia Settings page

**Endpoint**

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}
```

**Request**

```json
{
  "contents": [{
    "parts": [{
      "text": "Validate this AQI reading: Delhi AQI=460, PM2.5=150µg/m³, Temperature=25°C, Wind=5m/s. Is this reasonable for April 2025?"
    }]
  }]
}
```

**Response**

```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "Yes, this is reasonable. Delhi experiences severe air quality in April due to dust storms and residual pollution from winter. PM2.5 of 150µg/m³ is typical for this period. The reading is valid."
      }]
    }
  }]
}
```

**Backend Implementation**

```typescript
// server/routers.ts
async function validateWithGemini(aqi: number, pm25: number, city: string, apiKey: string) {
  const prompt = `Validate this AQI reading: ${city} AQI=${aqi}, PM2.5=${pm25}µg/m³. Is this reasonable? Respond with "VALID" or "ANOMALY" followed by explanation.`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );
  
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  
  return {
    isValid: text.includes('VALID'),
    explanation: text
  };
}
```

**Advantages**
- ✅ AI-powered anomaly detection
- ✅ Contextual validation (considers season, location)
- ✅ Free tier available
- ✅ Catches data quality issues

**Disadvantages**
- ❌ Requires API key
- ❌ Rate limits (15 requests/minute free tier)
- ❌ Adds latency (API call per reading)

---

### 4. NASA FIRMS (Fire Information & Management System) — Optional

**Status** — 🔧 Optional (user provides key in Settings)

**Purpose** — Track fires and smoke affecting air quality

**Coverage** — Global satellite data

**Cost** — Free

**Get API Key**

1. Visit [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/area/)
2. Sign up for account
3. Request API key
4. Paste in AQIndia Settings page

**Endpoint**

```
GET https://firms.modaps.eosdis.nasa.gov/api/area/json/MODIS_NRT/{key}/{polygon}/{date}
```

**Response**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "acq_date": "2025-04-11",
        "confidence": 95,
        "frp": 450.5,
        "instrument": "MODIS"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [77.1025, 28.7041]
      }
    }
  ]
}
```

**Backend Implementation**

```typescript
// server/routers.ts
async function fetchNASAFires(lat: number, lon: number, apiKey: string) {
  // Create bounding box around city
  const polygon = `${lon-0.5},${lat-0.5},${lon+0.5},${lat+0.5}`;
  const date = new Date().toISOString().split('T')[0];
  
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/json/MODIS_NRT/${apiKey}/${polygon}/${date}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    fireCount: data.features.length,
    avgConfidence: data.features.reduce((sum, f) => sum + f.properties.confidence, 0) / data.features.length,
    fires: data.features
  };
}
```

**Advantages**
- ✅ Satellite-based fire detection
- ✅ Free API
- ✅ Global coverage
- ✅ Helps explain AQI spikes

**Disadvantages**
- ❌ Requires API key
- ❌ Latency (daily updates)
- ❌ Not real-time

---

### 5. CPCB (Central Pollution Control Board) — Optional

**Status** — 🔧 Optional (historical data)

**Purpose** — Official Indian government AQI data

**Coverage** — 300+ stations across India

**Cost** — Free

**Data Source**

```
https://www.cpcb.gov.in/
```

**Manual Download**

1. Visit [cpcb.gov.in](https://www.cpcb.gov.in/)
2. Download historical AQI data
3. Import into AQIndia

**Backend Implementation**

```typescript
// server/routers.ts
async function importCPCBData(csvFile: File) {
  const text = await csvFile.text();
  const rows = text.split('\n');
  
  const data = rows.slice(1).map(row => {
    const [date, city, aqi, pm25, pm10, ...rest] = row.split(',');
    return { date, city, aqi: parseInt(aqi), pm25, pm10 };
  });
  
  // Store in database
  await db.insert(historical_aqi).values(data);
}
```

**Advantages**
- ✅ Official government data
- ✅ High accuracy
- ✅ Free
- ✅ Long historical records

**Disadvantages**
- ❌ Manual download required
- ❌ Not real-time
- ❌ Limited API access

---

## Historical Data

### Local JSON Files

AQIndia includes pre-generated historical data for 108 cities (2020-2025):

```
server/data/
├── cities.json                    # City metadata
├── recent_daily.json              # Latest AQI snapshot
├── cities_historical/
│   ├── delhi.json                 # Daily records for Delhi
│   ├── mumbai.json                # Daily records for Mumbai
│   └── ... (one file per city)
├── ml_models.json                 # Model metrics
├── shap_values.json               # Feature importance
├── festival_impact.json           # Diwali/Holi analysis
├── source_apportionment.json      # NMF source breakdown
└── seasonal_decomp.json           # Seasonal decomposition
```

**Format: cities_historical/{city}.json**

```json
[
  {
    "date": "2025-04-11",
    "aqi": 137,
    "pm25": 76,
    "pm10": 118,
    "no2": 45,
    "so2": 15,
    "o3": 35,
    "co": 0.5
  },
  ...
]
```

**Backend Implementation**

```typescript
// server/routers.ts
import fs from 'fs';

function getCityHistorical(cityId: string) {
  const path = `server/data/cities_historical/${cityId}.json`;
  const data = fs.readFileSync(path, 'utf-8');
  return JSON.parse(data);
}
```

---

## ML Model Data

### Model Metrics

```json
{
  "random_forest": {
    "rmse": 13.1,
    "mae": 9.2,
    "r2": 0.87,
    "mape": 8.5
  },
  "xgboost": {
    "rmse": 12.3,
    "mae": 8.5,
    "r2": 0.89,
    "mape": 7.8
  },
  ...
}
```

### SHAP Values

```json
[
  {
    "feature": "pm25_lag_1",
    "importance": 0.35,
    "mean_abs_shap": 12.5,
    "direction": "positive"
  },
  {
    "feature": "temperature",
    "importance": 0.22,
    "mean_abs_shap": 8.3,
    "direction": "negative"
  },
  ...
]
```

---

## Multi-Source Load Balancing

When multiple API keys are provided, AQIndia intelligently selects the best source:

```typescript
// server/routers.ts
async function fetchAQIWithLoadBalancing(cityId: string, apiKeys: APIKeys) {
  const sources = [];
  
  // Try each source in priority order
  if (apiKeys.waqi) {
    try {
      sources.push(await fetchWAQI(cityId, apiKeys.waqi));
    } catch (e) {
      console.warn('WAQI failed:', e);
    }
  }
  
  if (apiKeys.openMeteo) {
    try {
      sources.push(await fetchOpenMeteo(cityId, apiKeys.openMeteo));
    } catch (e) {
      console.warn('Open-Meteo failed:', e);
    }
  }
  
  // If multiple sources available, validate with Gemini
  if (sources.length > 1 && apiKeys.gemini) {
    for (const source of sources) {
      const validation = await validateWithGemini(source.aqi, source.pm25, cityId, apiKeys.gemini);
      source.validated = validation.isValid;
    }
  }
  
  // Return best source (validated > multiple sources > single source)
  const validated = sources.filter(s => s.validated);
  if (validated.length > 0) return validated[0];
  if (sources.length > 1) return sources[0];
  return sources[0];
}
```

---

## Data Quality Checks

### Validation Rules

```typescript
function validateAQI(aqi: number, pm25: number, city: string): ValidationResult {
  const errors = [];
  
  // AQI range check
  if (aqi < 0 || aqi > 500) {
    errors.push(`AQI ${aqi} out of valid range [0, 500]`);
  }
  
  // PM2.5 range check
  if (pm25 < 0 || pm25 > 1000) {
    errors.push(`PM2.5 ${pm25} out of valid range [0, 1000]`);
  }
  
  // Seasonal reasonableness
  const month = new Date().getMonth();
  if (month >= 10 || month <= 2) { // Oct-Feb (winter)
    if (aqi < 50) {
      errors.push(`AQI ${aqi} unusually low for winter in ${city}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

## Rate Limiting

### API Rate Limits

| API | Free Tier | Paid Tier |
|-----|-----------|-----------|
| Open-Meteo | 10,000 req/day | Unlimited |
| WAQI | 500 req/day | 10,000 req/day |
| Gemini | 15 req/min | 1,000 req/min |
| NASA FIRMS | Unlimited | Unlimited |

### Client-Side Caching

```typescript
// Cache responses for 5 minutes
const cache = new Map();

function getCachedOrFetch(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

---

## Adding New Data Sources

### Step 1: Create Fetcher Function

```typescript
// server/routers.ts
async function fetchNewSource(cityId: string, apiKey: string) {
  const response = await fetch(`https://api.newsource.com/aqi/${cityId}?key=${apiKey}`);
  const data = await response.json();
  
  return {
    aqi: data.aqi_value,
    pm25: data.pm25,
    pm10: data.pm10,
    source: 'NewSource'
  };
}
```

### Step 2: Add to Load Balancing

```typescript
// In fetchAQIWithLoadBalancing()
if (apiKeys.newSource) {
  try {
    sources.push(await fetchNewSource(cityId, apiKeys.newSource));
  } catch (e) {
    console.warn('NewSource failed:', e);
  }
}
```

### Step 3: Update Settings UI

```typescript
// client/src/pages/APISettings.tsx
const sources = [
  { name: 'WAQI', key: 'waqi', url: 'https://aqicn.org/data-platform/token' },
  { name: 'Gemini', key: 'gemini', url: 'https://aistudio.google.com/app/apikey' },
  { name: 'NewSource', key: 'newSource', url: 'https://newsource.com/api/key' },
];
```

---

## Troubleshooting

### API Key Not Working

1. Verify key is correct (copy-paste carefully)
2. Check rate limits haven't been exceeded
3. Verify API endpoint is accessible
4. Check browser console for error messages

### Data Not Updating

1. Check cache TTL (default 5 minutes)
2. Manually refresh page (Ctrl+R)
3. Check backend logs for API errors
4. Verify internet connection

### Anomalous AQI Values

1. Enable Gemini validation in Settings
2. Check if fire/smoke data correlates (NASA FIRMS)
3. Compare with multiple sources (WAQI + Open-Meteo)
4. Review historical data for seasonal patterns

---

## Next Steps

- Read **API_REFERENCE.md** for tRPC endpoint documentation
- Read **ARCHITECTURE.md** for system design
- Read **UPGRADE_SUGGESTIONS.md** for feature ideas
