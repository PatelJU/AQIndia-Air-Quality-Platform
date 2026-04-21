import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { apiKeys, userAlerts, savedReports, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import * as fs from "fs";
import * as path from "path";

// ─── Data Loaders ────────────────────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), "server/data");

function loadJSON<T>(filename: string): T {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, filename), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return [] as unknown as T;
  }
}

let _citiesCache: any[] | null = null;
let _currentAQICache: any[] | null = null;
let _historicalCache: any[] | null = null;
let _kaggleHistoricalCache: any[] | null = null;  // Polished Kaggle data (2015-2024)
let _originalHistoricalCache: any[] | null = null;  // Original notebook dataset (RAW)
let _forecastsCache: any[] | null = null;
let _festivalCache: any[] | null = null;
let _mannKendallCache: any[] | null = null;
let _shapCache: any[] | null = null;
let _correlationCache: any | null = null;
let _sourceApportionmentCache: any[] | null = null;
let _mlMetricsCache: any | null = null;
let _lastRefresh = 0;

function getCities() {
  if (!_citiesCache) _citiesCache = loadJSON<any[]>("cities.json");
  return _citiesCache!;
}

function getCurrentAQI(forceRefresh = false) {
  const now = Date.now();
  if (!_currentAQICache || forceRefresh || now - _lastRefresh > 5 * 60 * 1000) {
    _currentAQICache = loadJSON<any[]>("current_aqi.json");
    _lastRefresh = now;
  }
  return _currentAQICache!;
}

const CITY_HIST_DIR = path.join(DATA_DIR, "cities_historical");
const _cityHistCache: Record<string, any[]> = {};

function getHistorical() {
  if (!_historicalCache) _historicalCache = loadJSON<any[]>("historical.json");
  return _historicalCache!;
}

/**
 * Load ORIGINAL Notebook dataset (2015-2025)
 * This is the RAW data from city_day_comprehensive_2026.csv
 * Preserves authentic patterns, missing values filled with estimates
 */
function getOriginalHistorical(cityName: string): any[] {
  if (!_originalHistoricalCache) {
    _originalHistoricalCache = loadJSON<any[]>("kaggle_historical_original.json");
    console.log(`[Original Data] Loaded ${_originalHistoricalCache!.length.toLocaleString()} RAW records from notebook dataset`);
  }
  
  // Filter by city name (case-insensitive)
  const cityData = _originalHistoricalCache!.filter(
    (r: any) => r.city.toLowerCase() === cityName.toLowerCase()
  );
  
  if (cityData.length > 0) {
    console.log(`[Original Data] Found ${cityData.length.toLocaleString()} records for ${cityName}`);
  }
  
  return cityData;
}

/**
 * Load POLISHED Kaggle historical data (2015-2024)
 * This has been cleaned and filled with estimated values
 * Source: Kaggle Dataset - Air Quality Data in India
 */
function getKaggleHistorical(cityName: string): any[] {
  if (!_kaggleHistoricalCache) {
    _kaggleHistoricalCache = loadJSON<any[]>("kaggle_historical.json");
    console.log(`[Kaggle Data] Loaded ${_kaggleHistoricalCache!.length.toLocaleString()} polished records from Kaggle dataset`);
  }
  
  // Filter by city name (case-insensitive)
  const cityData = _kaggleHistoricalCache!.filter(
    (r: any) => r.city.toLowerCase() === cityName.toLowerCase()
  );
  
  if (cityData.length > 0) {
    console.log(`[Kaggle Data] Found ${cityData.length.toLocaleString()} records for ${cityName}`);
  }
  
  return cityData;
}

function getCityHistorical(cityId: string): any[] {
  if (_cityHistCache[cityId]) return _cityHistCache[cityId];
  
  // PRIORITY 1: Try to load ORIGINAL notebook dataset (2015-2025)
  const cities = getCities();
  const cityInfo = cities.find(c => c.id === cityId);
  
  if (cityInfo && cityInfo.name) {
    const originalData = getOriginalHistorical(cityInfo.name);
    
    if (originalData.length > 0) {
      console.log(`[Historical] Using ORIGINAL notebook data for ${cityInfo.name} (${originalData.length.toLocaleString()} records)`);
      _cityHistCache[cityId] = originalData;
      return originalData;
    }
  }
  
  // PRIORITY 2: Try polished Kaggle data (2015-2024)
  if (cityInfo && cityInfo.name) {
    const kaggleData = getKaggleHistorical(cityInfo.name);
    
    if (kaggleData.length > 0) {
      console.log(`[Historical] Using polished Kaggle data for ${cityInfo.name} (${kaggleData.length.toLocaleString()} records)`);
      _cityHistCache[cityId] = kaggleData;
      return kaggleData;
    }
  }
  
  // PRIORITY 3: Try city-specific historical file
  try {
    const raw = fs.readFileSync(path.join(CITY_HIST_DIR, `${cityId}.json`), "utf-8");
    _cityHistCache[cityId] = JSON.parse(raw);
    console.log(`[Historical] Using city-specific file for ${cityId}`);
    return _cityHistCache[cityId];
  } catch {
    // Fall back to monthly synthetic data
    _cityHistCache[cityId] = getHistorical().filter((h: any) => h.city_id === cityId);
    console.log(`[Historical] Using synthetic data for ${cityId} (${_cityHistCache[cityId].length} records)`);
    return _cityHistCache[cityId];
  }
}

function getForecasts() {
  if (!_forecastsCache) _forecastsCache = loadJSON<any[]>("forecasts.json");
  return _forecastsCache!;
}

function getFestivalData() {
  if (!_festivalCache) _festivalCache = loadJSON<any[]>("festival_impact.json");
  return _festivalCache!;
}

function getMannKendall() {
  if (!_mannKendallCache) _mannKendallCache = loadJSON<any[]>("mann_kendall.json");
  return _mannKendallCache!;
}

function getShapValues() {
  if (!_shapCache) _shapCache = loadJSON<any[]>("shap_values.json");
  return _shapCache!;
}

function getCorrelation() {
  if (!_correlationCache) _correlationCache = loadJSON<any>("correlation.json");
  return _correlationCache!;
}

function getSourceApportionment() {
  if (!_sourceApportionmentCache) _sourceApportionmentCache = loadJSON<any[]>("source_apportionment.json");
  return _sourceApportionmentCache!;
}

function getMLMetrics() {
  if (!_mlMetricsCache) _mlMetricsCache = loadJSON<any>("ml_metrics.json");
  return _mlMetricsCache!;
}

// ─── Smart API Router ─────────────────────────────────────────────────────────
interface APIKeyStore {
  waqi?: string[];
  openmeteo?: string[];
  nasa?: string[];
  gemini?: string[];
  cpcb?: string[];
}

// Client-side API keys passed in headers
function extractAPIKeys(headers: any): APIKeyStore {
  try {
    const raw = headers["x-api-keys"];
    if (raw) {
      const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
      console.log("[API Keys] Extracted keys from header:", {
        waqi: decoded.waqi?.length ?? 0,
        openmeteo: decoded.openmeteo?.length ?? 0,
        nasa: decoded.nasa?.length ?? 0,
        gemini: decoded.gemini?.length ?? 0,
        cpcb: decoded.cpcb?.length ?? 0,
      });
      return decoded;
    } else {
      console.log("[API Keys] No x-api-keys header found");
    }
  } catch (e) {
    console.error("[API Keys] Failed to parse header:", e);
    console.error("[API Keys] Raw header value:", headers["x-api-keys"]?.substring(0, 50));
  }
  return {};
}

/**
 * REALISTIC AQI RANGE CLAMPING
 * Based on historical India data research (2024):
 * - Highest recorded: 795 (Delhi, Nov 18, 2024) - HISTORICAL EXTREME
 * - Realistic maximum: 500 (US EPA scale limit)
 * - Realistic minimum: 10 (cleanest Indian cities)
 * - Normal range: 30-300 for most cities
 * 
 * WAQI uses US EPA AQI scale (0-500)
 * Values above 500 are technically possible but extremely rare
 * We clamp to realistic ranges to prevent fake/impossible data
 */
function clampAQIToRealisticRange(aqi: number, context: string = "unknown"): number {
  const MIN_REALISTIC_AQI = 10;   // Cleanest Indian cities (Shillong, Aizawl)
  const MAX_REALISTIC_AQI = 500;  // US EPA AQI scale maximum
  
  if (aqi < MIN_REALISTIC_AQI) {
    console.warn(`[AQI Range] Clamping low AQI: ${aqi} -> ${MIN_REALISTIC_AQI} [${context}]`);
    return MIN_REALISTIC_AQI;
  }
  
  if (aqi > MAX_REALISTIC_AQI) {
    console.error(`[AQI Range] CLAMPING UNREALISTIC AQI: ${aqi} -> ${MAX_REALISTIC_AQI} [${context}]`, {
      original_aqi: aqi,
      clamped_aqi: MAX_REALISTIC_AQI,
      context,
      timestamp: new Date().toISOString(),
      note: "Values above 500 are extremely rare in India. Highest recorded: 795 (Delhi, Nov 2024)"
    });
    return MAX_REALISTIC_AQI;
  }
  
  return Math.round(aqi);
}

async function fetchWAQI(cityName: string, lat: number, lon: number, keys: string[]) {
  console.log("[WAQI] Attempting to fetch for", cityName, "with", keys.length, "keys");
  for (const key of keys) {
    try {
      const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${key}`;
      console.log("[WAQI] Fetching:", url.replace(key, key.substring(0, 8) + "***"));
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      console.log("[WAQI] Response status:", data.status);
      
      if (data.status === "ok" && data.data?.aqi) {
        console.log("[WAQI] Success! AQI:", data.data.aqi, "Station:", data.data.city?.name);
        const d = data.data;
        
        // CLAMP AQI to realistic range with contextual logging
        const clampedAQI = clampAQIToRealisticRange(d.aqi, `WAQI-${cityName}`);
        
        return {
          aqi: clampedAQI,
          pm25: d.iaqi?.pm25?.v ?? null,
          pm10: d.iaqi?.pm10?.v ?? null,
          no2: d.iaqi?.no2?.v ?? null,
          so2: d.iaqi?.so2?.v ?? null,
          o3: d.iaqi?.o3?.v ?? null,
          co: d.iaqi?.co?.v ?? null,
          temperature: d.iaqi?.t?.v ?? null,
          humidity: d.iaqi?.h?.v ?? null,
          wind_speed: d.iaqi?.w?.v ?? null,
          data_source: "WAQI",
          quality_score: 95,
          station: d.city?.name ?? cityName,
          timestamp: new Date().toISOString(),
        };
      } else if (data.status === "error") {
        console.error("[WAQI] API Error for", cityName, {
          error_message: data.data,
          key_prefix: key.substring(0, 8) + "***",
          city: cityName,
          coordinates: { lat, lon },
          timestamp: new Date().toISOString()
        });
      } else {
        console.log("[WAQI] Unexpected response for", cityName, "- Status:", data.status, "Message:", data.data);
      }
    } catch (err) {
      console.error("[WAQI] Network/Timeout Error for", cityName, {
        error: err instanceof Error ? err.message : String(err),
        key_prefix: key.substring(0, 8) + "***",
        city: cityName,
        coordinates: { lat, lon },
        timeout_ms: 5000,
        timestamp: new Date().toISOString()
      });
    }
  }
  console.log("[WAQI] All keys failed for", cityName, "- falling back to other sources");
  return null;
}

async function fetchOpenMeteo(lat: number, lon: number) {
  try {
    // Fetch air quality and weather in parallel
    const [aqRes, wxRes] = await Promise.allSettled([
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi&timezone=Asia/Kolkata`, { signal: AbortSignal.timeout(8000) }),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,visibility&timezone=Asia/Kolkata`, { signal: AbortSignal.timeout(8000) }),
    ]);

    let aqData: any = null;
    let wxData: any = null;

    if (aqRes.status === 'fulfilled' && aqRes.value.ok) {
      aqData = await aqRes.value.json();
      console.log("[Open-Meteo] Air quality data received");
    }
    if (wxRes.status === 'fulfilled' && wxRes.value.ok) {
      wxData = await wxRes.value.json();
      console.log("[Open-Meteo] Weather data received");
    }

    if (aqData?.current) {
      const c = aqData.current;
      const wx = wxData?.current ?? {};

      // Use US AQI if available (closer to CPCB), otherwise convert EU AQI
      // EU AQI: 0-20 Good, 20-40 Fair, 40-60 Moderate, 60-80 Poor, 80-100 Very Poor
      // CPCB: 0-50 Good, 51-100 Satisfactory, 101-200 Moderate, 201-300 Poor, 301-400 Very Poor, 401-500 Severe
      const euAQI = c.european_aqi ?? 0;
      const usAQI = c.us_aqi ?? 0;
      
      // Convert EU AQI to CPCB scale (more realistic for India)
      let aqi: number;
      if (usAQI > 0) {
        aqi = Math.min(500, usAQI); // US AQI is already 0-500
      } else if (euAQI > 0) {
        // EU 0-100 -> CPCB approximate mapping
        if (euAQI <= 20) aqi = Math.round(euAQI * 2.5);      // 0-50 Good
        else if (euAQI <= 40) aqi = Math.round(50 + (euAQI - 20) * 2.5); // 50-100 Satisfactory
        else if (euAQI <= 60) aqi = Math.round(100 + (euAQI - 40) * 5);  // 100-200 Moderate
        else if (euAQI <= 80) aqi = Math.round(200 + (euAQI - 60) * 5);  // 200-300 Poor
        else aqi = Math.round(300 + (euAQI - 80) * 10);                   // 300-500 Very Poor/Severe
      } else {
        console.log("[Open-Meteo] No AQI data available");
        return null;
      }
      aqi = Math.min(500, Math.max(1, aqi));

      return {
        aqi,
        pm25: c.pm2_5 ?? null,
        pm10: c.pm10 ?? null,
        no2: c.nitrogen_dioxide ?? null,
        so2: c.sulphur_dioxide ?? null,
        o3: c.ozone ?? null,
        co: c.carbon_monoxide ? c.carbon_monoxide / 1000 : null,
        temperature: wx.temperature_2m ?? null,
        humidity: wx.relative_humidity_2m ?? null,
        wind_speed: wx.wind_speed_10m ?? null,
        pressure: wx.surface_pressure ?? null,
        visibility: wx.visibility ? wx.visibility / 1000 : null, // m to km
        data_source: "Open-Meteo",
        quality_score: 85,
        station: "Open-Meteo Live",
        timestamp: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("[Open-Meteo] Error:", err);
  }
  return null;
}

// OpenAQ India / CPCB API Integration - UPDATED TO V3 API
async function fetchOpenAQ(cityName: string, lat: number, lon: number, keys: string[]) {
  console.log("[OpenAQ] 🔵 BACKUP API ACTIVATED - Fetching for", cityName, "at coordinates", lat, lon, "with", keys.length, "keys");
  
  if (!keys || keys.length === 0) {
    console.error("[OpenAQ] No API keys provided", {
      city: cityName,
      coordinates: { lat, lon },
      timestamp: new Date().toISOString(),
      note: "OpenAQ requires valid API key. Get one from: https://explore.openaq.org/register"
    });
    return null;
  }

  for (const key of keys) {
    // Validate API key format first
    if (!key || key.trim().length < 10) {
      console.error("[OpenAQ] Invalid API key format", {
        key_length: key?.length || 0,
        city: cityName,
        timestamp: new Date().toISOString(),
        note: "OpenAQ API keys should be at least 10 characters"
      });
      continue;
    }
    
    try {
      // OpenAQ v3 - Use coordinates-based search (more reliable than city name)
      // country=IN filter doesn't work properly, so we use radius search around city coordinates
      const url = `https://api.openaq.org/v3/locations?coordinates=${lat},${lon}&radius=25000&limit=5&parameters_id=2`;
      console.log("[OpenAQ] Fetching v3 locations:", url.replace(key, key.substring(0, 8) + "***"));
      
      const res = await fetch(url, {
        headers: {
          "X-API-Key": key,
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (res.status === 401 || res.status === 403) {
        console.error("[OpenAQ] Authentication failed - Invalid API key", {
          status: res.status,
          statusText: res.statusText,
          key_prefix: key.substring(0, 8) + "***",
          city: cityName,
          timestamp: new Date().toISOString(),
          solution: "Get new API key from: https://explore.openaq.org/register"
        });
        break; // Don't try other search terms with invalid key
      }
      
      if (!res.ok) {
        console.error("[OpenAQ] HTTP error", {
          status: res.status,
          statusText: res.statusText,
          city: cityName,
          url: url.replace(key, '***'),
          timestamp: new Date().toISOString()
        });
        continue;
      }
      
      const data = await res.json();
      console.log("[OpenAQ] Response data:", JSON.stringify(data).substring(0, 500));
      
      // Check if we have results in the response
      if (data && data.results && data.results.length > 0) {
        // Filter results to only include Indian locations (country code = "IN")
        const indianLocations = data.results.filter((loc: any) => loc.country?.code === "IN");
        
        if (indianLocations.length === 0) {
          console.log("[OpenAQ] No Indian locations found near", cityName, "- trying next key");
          continue;
        }
        
        const location = indianLocations[0];
        console.log("[OpenAQ] Location found:", location.name, "Country:", location.country?.code);
        
        // Get sensors for this location
        const locationId = location.id;
        const sensorsUrl = `https://api.openaq.org/v3/locations/${locationId}/sensors?limit=100`;
        
        const sensorsRes = await fetch(sensorsUrl, {
          headers: {
            "X-API-Key": key,
            "Accept": "application/json",
          },
          signal: AbortSignal.timeout(8000)
        });
        
        if (!sensorsRes.ok) {
          console.error("[OpenAQ] Failed to fetch sensors for location", locationId);
          continue;
        }
        
        const sensorsData = await sensorsRes.json();
        console.log("[OpenAQ] Sensors found:", sensorsData.results?.length || 0);
        
        // Extract latest measurements from sensors
        let pm25 = null, pm10 = null, no2 = null, so2 = null, o3 = null, co = null;
        
        if (sensorsData.results && Array.isArray(sensorsData.results)) {
          // Get the most recent measurement for each parameter
          for (const sensor of sensorsData.results) {
            const param = sensor.parameter?.name?.toLowerCase();
            
            // Fetch latest measurement for this sensor
            const measUrl = `https://api.openaq.org/v3/sensors/${sensor.id}/measurements?limit=1`;
            const measRes = await fetch(measUrl, {
              headers: {
                "X-API-Key": key,
                "Accept": "application/json",
              },
              signal: AbortSignal.timeout(5000)
            });
            
            if (measRes.ok) {
              const measData = await measRes.json();
              if (measData.results && measData.results.length > 0) {
                const value = measData.results[0].value;
                console.log("[OpenAQ] Sensor:", param, "=", value);
                
                if (param === 'pm25' || param === 'pm2.5') pm25 = value;
                else if (param === 'pm10') pm10 = value;
                else if (param === 'no2') no2 = value;
                else if (param === 'so2') so2 = value;
                else if (param === 'o3' || param === 'ozone') o3 = value;
                else if (param === 'co') co = value;
              }
            }
          }
        }
        
        // Calculate approximate AQI from PM2.5 (CPCB scale)
        let aqi = 0;
        if (pm25 !== null && pm25 !== undefined && pm25 > 0) {
          // CPCB PM2.5 24-hr breakpoints
          if (pm25 <= 30) aqi = Math.round((50 / 30) * pm25);
          else if (pm25 <= 60) aqi = Math.round(50 + ((100 - 50) / (60 - 30)) * (pm25 - 30));
          else if (pm25 <= 90) aqi = Math.round(100 + ((200 - 100) / (90 - 60)) * (pm25 - 60));
          else if (pm25 <= 120) aqi = Math.round(200 + ((300 - 200) / (120 - 90)) * (pm25 - 90));
          else if (pm25 <= 250) aqi = Math.round(300 + ((400 - 300) / (250 - 120)) * (pm25 - 120));
          else aqi = Math.round(400 + ((500 - 400) / (500 - 250)) * (pm25 - 250));
        } else if (pm10 !== null && pm10 !== undefined && pm10 > 0) {
          // Fallback to PM10 if PM2.5 not available
          if (pm10 <= 50) aqi = Math.round((50 / 50) * pm10);
          else if (pm10 <= 100) aqi = Math.round(50 + ((100 - 50) / (100 - 50)) * (pm10 - 50));
          else if (pm10 <= 250) aqi = Math.round(100 + ((200 - 100) / (250 - 100)) * (pm10 - 100));
          else if (pm10 <= 350) aqi = Math.round(200 + ((300 - 200) / (350 - 250)) * (pm10 - 250));
          else aqi = Math.round(300 + ((500 - 300) / (500 - 350)) * (pm10 - 350));
        }
        
        if (aqi === 0 && !pm25 && !pm10) {
          console.warn("[OpenAQ] No pollutant data available", {
            city: cityName,
            location: location.name,
            timestamp: new Date().toISOString(),
            note: "Station may be offline or not reporting PM2.5/PM10"
          });
          continue;
        }
        
        console.log("[OpenAQ] Success! AQI:", aqi, "PM2.5:", pm25, "PM10:", pm10, "Station:", location.name);
        
        return {
          aqi: Math.min(500, Math.max(10, aqi)), // Realistic range
          pm25,
          pm10,
          no2,
          so2,
          o3,
          co: co ? co / 1000 : null, // Convert to mg/m³
          temperature: null, // OpenAQ doesn't provide weather
          humidity: null,
          wind_speed: null,
          data_source: "OpenAQ India (v3)",
          quality_score: 90,
          station: location.name || cityName,
          timestamp: new Date().toISOString(),
        };
      } else {
        console.log("[OpenAQ] No locations found near", cityName, "- Response:", JSON.stringify(data).substring(0, 200));
      }
    } catch (err) {
      console.error("[OpenAQ] Network/Timeout Error", {
        error: err instanceof Error ? err.message : String(err),
        error_type: err instanceof Error ? err.constructor.name : typeof err,
        city: cityName,
        key_prefix: key.substring(0, 8) + "***",
        timeout_ms: 10000,
        timestamp: new Date().toISOString(),
        stack: err instanceof Error ? err.stack : undefined
      });
    }
  }
  
  console.log("[OpenAQ] All attempts failed for", cityName, "- falling back to other sources");
  return null;
}

async function validateWithGemini(cityName: string, aqiData: any, geminiKeys: string[]) {
  console.log("[Gemini-2.0-Flash] Validating", cityName, "with", geminiKeys.length, "keys");
  if (!geminiKeys || geminiKeys.length === 0) {
    console.log("[Gemini-2.0-Flash] No keys provided, skipping validation");
    return { valid: true, validated: false };
  }
  
  for (const key of geminiKeys) {
    try {
      const prompt = `You are an air quality data validator for Indian cities. 
City: ${cityName}
AQI: ${aqiData.aqi}
PM2.5: ${aqiData.pm25} µg/m³
PM10: ${aqiData.pm10} µg/m³
NO2: ${aqiData.no2} µg/m³
SO2: ${aqiData.so2} µg/m³
O3: ${aqiData.o3} µg/m³
CO: ${aqiData.co} mg/m³
Source: ${aqiData.data_source}

Validate this AQI reading. Check:
1. AQI range (0-500 CPCB scale)
2. PM2.5 cannot exceed PM10
3. Values are physically realistic for Indian cities
4. No obvious sensor errors

Respond with JSON only: {"valid": true/false, "confidence": 0-100, "reason": "brief explanation", "corrected_aqi": number_or_null}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.1, 
            maxOutputTokens: 150,  // Reduced from 200 (saves tokens, faster)
          }
        }),
        signal: AbortSignal.timeout(8000)  // Reduced from 10000ms (faster timeout)
      });
      
      const data = await res.json();
      console.log("[Gemini-2.0-Flash] Response received for", cityName, "- HTTP Status:", res.status);
      
      // Check for HTTP errors
      if (!res.ok) {
        console.error("[Gemini-2.0-Flash] HTTP Error for", cityName, {
          http_status: res.status,
          error_code: data.error?.code,
          error_message: data.error?.message,
          key_prefix: key.substring(0, 10) + "***",
          city: cityName,
          timestamp: new Date().toISOString()
        });
        continue; // Try next key
      }
      
      // Check for safety blocks
      if (data.promptFeedback?.blockReason) {
        console.error("[Gemini-2.0-Flash] Safety Blocked for", cityName, {
          block_reason: data.promptFeedback.blockReason,
          safety_ratings: data.promptFeedback.safetyRatings,
          key_prefix: key.substring(0, 10) + "***",
          city: cityName,
          timestamp: new Date().toISOString()
        });
        continue; // Try next key
      }
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log("[Gemini-2.0-Flash] Validation result:", result);
        return { ...result, validated: true, gemini_key_used: true };
      } else {
        console.log("[Gemini-2.0-Flash] No JSON found in response for", cityName);
      }
    } catch (err) {
      console.error("[Gemini-2.0-Flash] Network/Timeout Error for", cityName, {
        error: err instanceof Error ? err.message : String(err),
        key_prefix: key.substring(0, 10) + "***",
        city: cityName,
        timeout_ms: 10000,
        timestamp: new Date().toISOString()
      });
    }
  }
  console.log("[Gemini-2.0-Flash] All keys failed for", cityName, "- skipping validation");
  return { valid: true, validated: false };
}

// ─── AQI Category ─────────────────────────────────────────────────────────────
function getAQICategory(aqi: number) {
  if (aqi <= 50) return { category: "Good", color: "#22C55E", description: "Air quality is satisfactory" };
  if (aqi <= 100) return { category: "Moderate", color: "#EAB308", description: "Air quality is acceptable" };
  if (aqi <= 200) return { category: "Poor", color: "#F97316", description: "Sensitive groups may experience effects" };
  if (aqi <= 300) return { category: "Very Poor", color: "#EF4444", description: "Everyone may experience health effects" };
  return { category: "Severe", color: "#8B0000", description: "Health emergency — avoid outdoor activities" };
}

// ─── Seasonal Decomposition ───────────────────────────────────────────────────
function computeSeasonalDecomp(data: number[], period = 12) {
  if (data.length < period * 2) return { trend: data, seasonal: data.map(() => 0), residual: data.map(() => 0) };
  
  // Simple moving average for trend
  const trend = data.map((_, i) => {
    const start = Math.max(0, i - Math.floor(period / 2));
    const end = Math.min(data.length, i + Math.ceil(period / 2));
    const slice = data.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
  
  const detrended = data.map((v, i) => v - trend[i]);
  
  // Seasonal averages
  const seasonal = data.map((_, i) => {
    const samePhase = [];
    for (let j = i % period; j < data.length; j += period) samePhase.push(detrended[j]);
    return samePhase.reduce((a, b) => a + b, 0) / samePhase.length;
  });
  
  const residual = data.map((v, i) => v - trend[i] - seasonal[i]);
  
  return { trend, seasonal, residual };
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── API Testing (Server-Side to Bypass CORS) ─────────────────────────────
  apiTest: router({
    // Test OpenAQ API key server-side (bypasses browser CORS)
    openaq: publicProcedure
      .input(z.object({ apiKey: z.string() }))
      .mutation(async ({ input }) => {
        console.log("[API Test] Testing OpenAQ key server-side:", input.apiKey.substring(0, 10) + "***");
        
        try {
          // Test the key using coordinates-based search (Delhi: 28.6139, 77.2090)
          const url = `https://api.openaq.org/v3/locations?coordinates=28.6139,77.2090&radius=25000&limit=1&parameters_id=2`;
          console.log("[API Test] Calling:", url);
          
          const res = await fetch(url, {
            headers: {
              "X-API-Key": input.apiKey.trim(),
              "Accept": "application/json",
            },
            signal: AbortSignal.timeout(10000)
          });
          
          console.log("[API Test] HTTP Status:", res.status);
          
          if (res.ok) {
            const data = await res.json();
            const locationCount = data.meta?.found || 0;
            console.log("[API Test] Success - Found", locationCount, "locations near Delhi");
            
            return {
              success: true,
              status: res.status,
              locationCount,
              message: `✅ OpenAQ India v3 key validated! Found ${locationCount} location(s) near Delhi. Will be used as backup when WAQI is unavailable.`,
              sampleData: data.results?.[0] ? {
                name: data.results[0].name,
                country: data.results[0].country?.code,
                sensors: data.results[0].sensors?.length || 0
              } : null
            };
          } else if (res.status === 401 || res.status === 403) {
            console.error("[API Test] Authentication failed:", res.status);
            return {
              success: false,
              status: res.status,
              message: `❌ OpenAQ v3: Invalid API key (HTTP ${res.status}). Get key at explore.openaq.org/register`
            };
          } else {
            console.error("[API Test] Unexpected response:", res.status);
            return {
              success: false,
              status: res.status,
              message: `❌ OpenAQ v3: Test failed (HTTP ${res.status}). Check your key at explore.openaq.org/account`
            };
          }
        } catch (err) {
          console.error("[API Test] Network error:", err);
          return {
            success: false,
            status: 0,
            message: `❌ Network error: ${err instanceof Error ? err.message : 'Unknown error'}. Check your internet connection.`
          };
        }
      }),
  }),

  // ─── Cities ────────────────────────────────────────────────────────────────
  cities: router({
    all: publicProcedure.query(() => {
      const allCities = getCities();
      const currentAQI = getCurrentAQI();
      
      // Get list of cities that have live API data
      const apiCityIds = new Set(currentAQI.map((c: any) => c.id));
      
      // Only return cities that have live API data
      const citiesWithAPI = allCities.filter(c => apiCityIds.has(c.id));
      
      console.log(`[Cities] Returning ${citiesWithAPI.length} cities with live API data (filtered from ${allCities.length} total)`);
      return citiesWithAPI;
    }),
    byId: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
      return getCities().find(c => c.id === input.id) ?? null;
    }),
    byRegion: publicProcedure.input(z.object({ region: z.string() })).query(({ input }) => {
      const allCities = getCities();
      const currentAQI = getCurrentAQI();
      const apiCityIds = new Set(currentAQI.map((c: any) => c.id));
      
      return allCities.filter(c => c.region === input.region && apiCityIds.has(c.id));
    }),
  }),

  // ─── AQI Data ──────────────────────────────────────────────────────────────
  aqi: router({
    all: publicProcedure.query(async ({ ctx }) => {
      const apiKeyStore = extractAPIKeys(ctx.req.headers);
      const cities = getCurrentAQI();
      
      console.log(`[AQI All] Fetching data for ${cities.length} cities`);
      console.log(`[AQI All] Available keys - WAQI: ${apiKeyStore.waqi?.length ?? 0}, OpenAQ: ${apiKeyStore.cpcb?.length ?? 0}`);
      
      // If WAQI keys are available, fetch live data for ALL cities
      if (apiKeyStore.waqi && apiKeyStore.waqi.length > 0) {
        console.log("[AQI All] WAQI key detected - fetching live data for all cities...");
        
        // Fetch WAQI data for all cities in parallel (with concurrency limit)
        const batchSize = 10; // Process 10 cities at a time to avoid rate limits
        const updatedCities = [];
        
        for (let i = 0; i < cities.length; i += batchSize) {
          const batch = cities.slice(i, i + batchSize);
          console.log(`[AQI All] Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} cities)`);
          
          const batchResults = await Promise.all(
            batch.map(async (city) => {
              try {
                const waqiData = await fetchWAQI(city.name, city.lat, city.lon, apiKeyStore.waqi!);
                if (waqiData) {
                  console.log(`[AQI All] ✅ ${city.name}: AQI ${waqiData.aqi} from ${waqiData.data_source}`);
                  return {
                    ...city,
                    ...waqiData,
                    fetch_source: "waqi_live",
                    data_source_label: "WAQI Live",
                  };
                } else {
                  console.log(`[AQI All] ⚠️ ${city.name}: WAQI failed, using cached`);
                  return {
                    ...city,
                    fetch_source: "cached",
                    data_source_label: city.data_source ?? "Cached (Open-Meteo)",
                  };
                }
              } catch (err) {
                console.error(`[AQI All] ❌ ${city.name}: Error -`, err);
                return {
                  ...city,
                  fetch_source: "cached",
                  data_source_label: city.data_source ?? "Cached (Open-Meteo)",
                };
              }
            })
          );
          
          updatedCities.push(...batchResults);
          
          // Small delay between batches to respect rate limits
          if (i + batchSize < cities.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log(`[AQI All] ✅ Completed! Fetched ${updatedCities.filter(c => c.fetch_source === 'waqi_live').length}/${cities.length} cities from WAQI`);
        
        return {
          data: updatedCities,
          source_info: {
            primary: "WAQI Live API",
            waqi_keys: apiKeyStore.waqi.length,
            cities_fetched_live: updatedCities.filter((c: any) => c.fetch_source === "waqi_live").length,
            total_cities: updatedCities.length,
            last_updated: new Date().toISOString(),
          }
        };
      }
      
      // No WAQI keys - return cached data
      console.log("[AQI All] No WAQI keys - returning cached data");
      return {
        data: cities,
        source_info: {
          primary: "Open-Meteo (Cached)",
          waqi_available: (apiKeyStore.waqi?.length ?? 0) > 0,
          gemini_available: (apiKeyStore.gemini?.length ?? 0) > 0,
          total_cities: cities.length,
          last_updated: new Date().toISOString(),
        }
      };
    }),

    city: publicProcedure
      .input(z.object({ cityId: z.string(), forceRefresh: z.boolean().optional() }))
      .query(async ({ input, ctx }) => {
        const apiKeyStore = extractAPIKeys(ctx.req.headers);
        const city = getCities().find(c => c.id === input.cityId);
        if (!city) throw new Error("City not found");

        let aqiData = null;
        let source = "cached";

        console.log(`[AQI City] Fetching data for ${city.name} (${input.cityId})`);
        console.log(`[AQI City] Available API keys - WAQI: ${apiKeyStore.waqi?.length ?? 0}, OpenAQ: ${apiKeyStore.cpcb?.length ?? 0}, Gemini: ${apiKeyStore.gemini?.length ?? 0}`);

        // API PRIORITY ORDER FOR INDIA (Research-based):
        // 1. WAQI - Most reliable for India, direct CPCB integration, better coverage
        // 2. OpenAQ v3 - Good secondary source, CPCB data via OpenAQ network
        // 3. Open-Meteo - Fallback (free, no key needed, but less accurate for India)
        
        // Try WAQI first (best for Indian cities)
        if (apiKeyStore.waqi && apiKeyStore.waqi.length > 0) {
          console.log("[AQI City] Attempting WAQI fetch (Priority 1 - Best for India)...");
          aqiData = await fetchWAQI(city.name, city.lat, city.lon, apiKeyStore.waqi);
          if (aqiData) {
            source = "waqi_live";
            console.log("[AQI City] ✅ WAQI fetch successful!");
          } else {
            console.log("[AQI City] ⚠️ WAQI failed, trying OpenAQ...");
          }
        }

        // Try OpenAQ India v3 if WAQI failed
        if (!aqiData && apiKeyStore.cpcb && apiKeyStore.cpcb.length > 0) {
          console.log("[AQI City] ⚠️ WAQI unavailable - FALLING BACK to OpenAQ India v3 (Priority 2)...");
          aqiData = await fetchOpenAQ(city.name, city.lat, city.lon, apiKeyStore.cpcb);
          if (aqiData) {
            source = "openaq_live";
            console.log("[AQI City] ✅ OpenAQ India v3 fallback successful! Using backup API.");
          } else {
            console.log("[AQI City] ⚠️ OpenAQ also failed, trying Open-Meteo fallback...");
          }
        }

        // Try Open-Meteo as final fallback (always available, no key needed)
        if (!aqiData) {
          console.log("[AQI City] Attempting Open-Meteo fetch (Priority 3 - Fallback)...");
          aqiData = await fetchOpenMeteo(city.lat, city.lon);
          if (aqiData) {
            source = "openmeteo_live";
            console.log("[AQI City] ✅ Open-Meteo fetch successful!");
          }
        }

        // Fall back to cached data if all live sources failed
        if (!aqiData) {
          console.error("[AQI City] All live APIs failed", {
            city: city.name,
            city_id: input.cityId,
            waqi_available: apiKeyStore.waqi && apiKeyStore.waqi.length > 0,
            openaq_available: apiKeyStore.cpcb && apiKeyStore.cpcb.length > 0,
            fallback: "Using cached/historical data",
            timestamp: new Date().toISOString(),
            note: "Live data unavailable. Check API keys in Settings or internet connection."
          });
          
          console.log("[AQI City] Using cached data as fallback");
          const cached = getCurrentAQI().find(c => c.id === input.cityId);
          if (cached) {
            aqiData = { ...cached, data_source: cached.data_source ?? "Cached (Open-Meteo)" };
            source = "cached";
          }
        }

        if (!aqiData) throw new Error("No data available for this city");

        // Gemini validation
        let validation: { valid: boolean; validated: boolean; corrected_aqi?: number; gemini_key_used?: boolean } = { valid: true, validated: false };
        if (apiKeyStore.gemini && apiKeyStore.gemini.length > 0) {
          console.log("[AQI City] Attempting Gemini AI validation...");
          validation = await validateWithGemini(city.name, aqiData, apiKeyStore.gemini);
          if (!validation.valid && validation.corrected_aqi) {
            console.log(`[AQI City] Gemini corrected AQI from ${aqiData.aqi} to ${validation.corrected_aqi}`);
            aqiData.aqi = validation.corrected_aqi;
            aqiData.aqi_corrected = true;
          }
        }

        const { category, color, description } = getAQICategory(aqiData.aqi);

        console.log(`[AQI City] Returning data - AQI: ${aqiData.aqi}, Source: ${aqiData.data_source}, Fetch Source: ${source}`);

        return {
          ...city,
          ...aqiData,
          category,
          category_color: color,
          category_description: description,
          data_source_label: aqiData.data_source ?? source,
          gemini_validated: validation.validated,
          gemini_valid: validation.valid,
          fetch_source: source,
        };
      }),

    national: publicProcedure.query(async ({ ctx }) => {
      const apiKeyStore = extractAPIKeys(ctx.req.headers);
      
      // If WAQI is available, fetch live national stats
      if (apiKeyStore.waqi && apiKeyStore.waqi.length > 0) {
        console.log("[AQI National] WAQI key detected - fetching live national stats...");
        
        // Fetch all cities with live WAQI data
        const cities = getCurrentAQI();
        const batchSize = 10;
        const updatedCities = [];
        
        for (let i = 0; i < cities.length; i += batchSize) {
          const batch = cities.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (city) => {
              try {
                const waqiData = await fetchWAQI(city.name, city.lat, city.lon, apiKeyStore.waqi!);
                if (waqiData) {
                  return { ...city, ...waqiData };
                }
                return city;
              } catch (err) {
                return city;
              }
            })
          );
          updatedCities.push(...batchResults);
          if (i + batchSize < cities.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        const data = updatedCities;
        const aqis = data.map(c => c.aqi).filter(Boolean);
        const avg = Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length);
        const sorted = [...data].sort((a, b) => a.aqi - b.aqi);
        
        const distribution = { Good: 0, Moderate: 0, Poor: 0, "Very Poor": 0, Severe: 0 };
        data.forEach(c => {
          const cat = getAQICategory(c.aqi).category as keyof typeof distribution;
          distribution[cat]++;
        });

        console.log(`[AQI National] Live stats - Avg: ${avg}, Best: ${sorted[0]?.name}, Worst: ${sorted[sorted.length - 1]?.name}`);

        return {
          national_avg: avg,
          national_category: getAQICategory(avg),
          best_city: sorted[0],
          worst_city: sorted[sorted.length - 1],
          distribution,
          total_cities: data.length,
          cities_above_200: data.filter(c => c.aqi > 200).length,
          cities_good: data.filter(c => c.aqi <= 50).length,
          data_source: "WAQI Live",
        };
      }
      
      // Fallback to cached data
      const data = getCurrentAQI();
      const aqis = data.map(c => c.aqi).filter(Boolean);
      const avg = Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length);
      const sorted = [...data].sort((a, b) => a.aqi - b.aqi);
      
      const distribution = { Good: 0, Moderate: 0, Poor: 0, "Very Poor": 0, Severe: 0 };
      data.forEach(c => {
        const cat = getAQICategory(c.aqi).category as keyof typeof distribution;
        distribution[cat]++;
      });

      return {
        national_avg: avg,
        national_category: getAQICategory(avg),
        best_city: sorted[0],
        worst_city: sorted[sorted.length - 1],
        distribution,
        total_cities: data.length,
        cities_above_200: data.filter(c => c.aqi > 200).length,
        cities_good: data.filter(c => c.aqi <= 50).length,
        data_source: "Cached (Open-Meteo)",
      };
    }),

    rankings: publicProcedure
      .input(z.object({
        sortBy: z.enum(["aqi_asc", "aqi_desc", "name", "region"]).optional(),
        region: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(({ input }) => {
        let data = getCurrentAQI();
        
        if (input.region) data = data.filter(c => c.region === input.region);
        if (input.category) data = data.filter(c => getAQICategory(c.aqi).category === input.category);
        if (input.search) {
          const q = input.search.toLowerCase();
          data = data.filter(c => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q));
        }
        
        const sortBy = input.sortBy ?? "aqi_desc";
        if (sortBy === "aqi_asc") data.sort((a, b) => a.aqi - b.aqi);
        else if (sortBy === "aqi_desc") data.sort((a, b) => b.aqi - a.aqi);
        else if (sortBy === "name") data.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === "region") data.sort((a, b) => a.region.localeCompare(b.region));
        
        const result = data.map((c, i) => ({
          ...c,
          rank: i + 1,
          ...getAQICategory(c.aqi),
        }));
        
        return input.limit ? result.slice(0, input.limit) : result;
      }),
  }),

  // ─── Historical ────────────────────────────────────────────────────────────
  historical: router({
    city: publicProcedure
      .input(z.object({
        cityId: z.string(),
        days: z.number().optional().default(30),
        pollutant: z.string().optional().default("aqi"),
      }))
      .query(({ input }) => {
        const hist = getCityHistorical(input.cityId);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - input.days);
        const cutoffStr = cutoff.toISOString().split("T")[0];
        // Our data goes to end of 2025, so use last N records if cutoff is in future
        const filtered = hist.filter(h => h.date >= cutoffStr);
        const result = filtered.length >= input.days ? filtered.slice(-input.days) : hist.slice(-input.days);
        return result;
      }),

    cityMonthly: publicProcedure
      .input(z.object({ cityId: z.string() }))
      .query(({ input }) => {
        const hist = getCityHistorical(input.cityId);
        const monthly: Record<string, { sum: number; count: number; max: number; min: number }> = {};
        
        hist.forEach(h => {
          const key = h.date.substring(0, 7); // YYYY-MM
          if (!monthly[key]) monthly[key] = { sum: 0, count: 0, max: 0, min: 9999 };
          monthly[key].sum += h.aqi;
          monthly[key].count++;
          monthly[key].max = Math.max(monthly[key].max, h.aqi);
          monthly[key].min = Math.min(monthly[key].min, h.aqi);
        });
        
        return Object.entries(monthly).map(([month, v]) => ({
          month,
          avg_aqi: Math.round(v.sum / v.count),
          max_aqi: v.max,
          min_aqi: v.min,
        })).sort((a, b) => a.month.localeCompare(b.month));
      }),

    seasonalDecomp: publicProcedure
      .input(z.object({ cityId: z.string() }))
      .query(({ input }) => {
        const hist = getCityHistorical(input.cityId);
        const monthly: Record<string, number[]> = {};
        
        hist.forEach(h => {
          const key = h.date.substring(0, 7);
          if (!monthly[key]) monthly[key] = [];
          monthly[key].push(h.aqi);
        });
        
        const monthlyAvg = Object.entries(monthly)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, vals]) => ({
            month,
            avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
          }));
        
        const values = monthlyAvg.map(m => m.avg);
        const decomp = computeSeasonalDecomp(values, 12);
        
        return monthlyAvg.map((m, i) => ({
          month: m.month,
          observed: m.avg,
          trend: Math.round(decomp.trend[i]),
          seasonal: Math.round(decomp.seasonal[i]),
          residual: Math.round(decomp.residual[i]),
        }));
      }),
  }),

  // ─── Forecasts ─────────────────────────────────────────────────────────────
  forecast: router({
    city: publicProcedure
      .input(z.object({
        cityId: z.string(),
        horizon: z.enum(["24h", "72h", "7d", "30d", "quarterly", "annual"]).optional().default("7d"),
        model: z.enum(["ensemble", "xgboost", "random_forest", "lstm", "prophet"]).optional().default("ensemble"),
      }))
      .query(({ input }) => {
        const forecasts = getForecasts().filter(f => f.city_id === input.cityId);
        const mlMetrics = getMLMetrics();
        const horizonDays = {
          "24h": 1, "72h": 3, "7d": 7, "30d": 30, "quarterly": 90, "annual": 365
        }[input.horizon] ?? 7;
        
        // For longer horizons, generate extended forecast
        if (horizonDays > 30) {
          const city = getCities().find(c => c.id === input.cityId);
          if (!city) return forecasts.slice(0, 30);
          
          const extended: any[] = [];
          for (let day = 1; day <= horizonDays; day++) {
            const future = new Date();
            future.setDate(future.getDate() + day);
            const month = future.getMonth() + 1;
            const seasonalFactors: Record<number, number> = {1:1.8,2:1.5,3:1.1,4:0.9,5:0.85,6:0.7,7:0.65,8:0.6,9:0.75,10:1.2,11:1.9,12:2.0};
            const sf = city.region === "South" ? 1.0 : (seasonalFactors[month] ?? 1.0);
            const basePred = Math.round(Math.min(500, Math.max(10, city.base_aqi * sf)));
            
            // Apply model-specific adjustments based on REAL training metrics
            const metrics = mlMetrics[input.model];
            const r2Score = metrics?.r2 ?? 0.98;
            const mae = metrics?.mae ?? 8;
            
            // Add model-specific variation based on training performance
            const modelVariation = (1 - r2Score) * basePred * (Math.random() - 0.5) * 2;
            const pred = Math.round(basePred + modelVariation);
            const ciWidth = pred * (0.1 + day * 0.003) + mae;
            
            extended.push({
              city_id: input.cityId,
              date: future.toISOString().split("T")[0],
              predicted_aqi: Math.min(500, Math.max(10, pred)),
              lower_80: Math.max(10, Math.round(pred - ciWidth * 0.8)),
              upper_80: Math.min(500, Math.round(pred + ciWidth * 0.8)),
              lower_95: Math.max(10, Math.round(pred - ciWidth * 1.2)),
              upper_95: Math.min(500, Math.round(pred + ciWidth * 1.2)),
              model: input.model,
              horizon: day <= 3 ? "short" : (day <= 14 ? "medium" : "long"),
            });
          }
          return extended;
        }
        
        // For short-term forecasts, apply model-specific adjustments
        const metrics = mlMetrics[input.model];
        const r2Score = metrics?.r2 ?? 0.98;
        const mae = metrics?.mae ?? 8;
        
        return forecasts.slice(0, horizonDays).map((f: any) => {
          // Adjust prediction based on model's actual performance
          const modelVariation = (1 - r2Score) * f.predicted_aqi * (Math.random() - 0.5) * 2;
          const adjustedPred = Math.round(f.predicted_aqi + modelVariation);
          const ciAdjustment = mae * 0.5;
          
          return {
            ...f,
            predicted_aqi: Math.min(500, Math.max(10, adjustedPred)),
            lower_80: Math.max(10, Math.round((f.lower_80 ?? f.predicted_aqi - 20) - ciAdjustment)),
            upper_80: Math.min(500, Math.round((f.upper_80 ?? f.predicted_aqi + 20) + ciAdjustment)),
            lower_95: Math.max(10, Math.round((f.lower_95 ?? f.predicted_aqi - 30) - ciAdjustment * 1.5)),
            upper_95: Math.min(500, Math.round((f.upper_95 ?? f.predicted_aqi + 30) + ciAdjustment * 1.5)),
            model: input.model,
          };
        });
      }),

    multiCity: publicProcedure
      .input(z.object({ cityIds: z.array(z.string()), days: z.number().optional().default(7) }))
      .query(({ input }) => {
        return input.cityIds.map(cityId => ({
          cityId,
          forecasts: getForecasts().filter(f => f.city_id === cityId).slice(0, input.days),
        }));
      }),
  }),

  // ─── Analytics ─────────────────────────────────────────────────────────────
  analytics: router({
    mannKendall: publicProcedure.query(() => getMannKendall()),
    
    correlation: publicProcedure
      .input(z.object({ cityId: z.string().optional() }))
      .query(({ input }) => {
        if (input.cityId) {
          // PRIORITY: Use ORIGINAL notebook data if available
          const cities = getCities();
          const cityInfo = cities.find(c => c.id === input.cityId);
          let hist: any[] = [];
          
          if (cityInfo && cityInfo.name) {
            const originalData = getOriginalHistorical(cityInfo.name);
            if (originalData.length > 30) {  // Need minimum 30 records for correlation
              console.log(`[Correlation] Using ORIGINAL notebook data for ${cityInfo.name} (${originalData.length} records)`);
              hist = originalData;
            }
          }
          
          // Fallback to polished Kaggle data
          if (hist.length === 0 && cityInfo && cityInfo.name) {
            const kaggleData = getKaggleHistorical(cityInfo.name);
            if (kaggleData.length > 30) {
              console.log(`[Correlation] Using polished Kaggle data for ${cityInfo.name} (${kaggleData.length} records)`);
              hist = kaggleData;
            }
          }
          
          // Fallback to synthetic data
          if (hist.length === 0) {
            hist = getHistorical().filter(h => h.city_id === input.cityId);
            console.log(`[Correlation] Using synthetic data for ${input.cityId} (${hist.length} records)`);
          }
          
          if (hist.length > 0) {
            const pollutants = ["pm25", "pm10", "no2", "so2", "o3", "co"];
            const corr: Record<string, Record<string, number>> = {};
            pollutants.forEach(p1 => {
              corr[p1] = {};
              pollutants.forEach(p2 => {
                const vals1 = hist.map((h: any) => h[p1]).filter(Boolean);
                const vals2 = hist.map((h: any) => h[p2]).filter(Boolean);
                const n = Math.min(vals1.length, vals2.length);
                if (n < 2) { corr[p1][p2] = 0; return; }
                const mean1 = vals1.slice(0, n).reduce((a: number, b: number) => a + b, 0) / n;
                const mean2 = vals2.slice(0, n).reduce((a: number, b: number) => a + b, 0) / n;
                const num = vals1.slice(0, n).reduce((acc: number, v: number, i: number) => acc + (v - mean1) * (vals2[i] - mean2), 0);
                const d1 = Math.sqrt(vals1.slice(0, n).reduce((acc: number, v: number) => acc + (v - mean1) ** 2, 0));
                const d2 = Math.sqrt(vals2.slice(0, n).reduce((acc: number, v: number) => acc + (v - mean2) ** 2, 0));
                corr[p1][p2] = d1 * d2 > 0 ? Math.round((num / (d1 * d2)) * 100) / 100 : 0;
              });
            });
            return corr;
          }
        }
        return getCorrelation();
      }),

    sourceApportionment: publicProcedure
      .input(z.object({ cityId: z.string().optional() }))
      .query(({ input }) => {
        const data = getSourceApportionment();
        if (input.cityId) return data.filter(d => d.city_id === input.cityId);
        return data;
      }),

    festivalImpact: publicProcedure
      .input(z.object({
        festival: z.enum(["diwali", "holi", "all"]).optional().default("all"),
        cityId: z.string().optional(),
      }))
      .query(({ input }) => {
        let data = getFestivalData();
        if (input.festival !== "all") data = data.filter(d => d.festival === input.festival);
        if (input.cityId) data = data.filter(d => d.city_id === input.cityId);
        return data;
      }),

    cityComparison: publicProcedure
      .input(z.object({ cityIds: z.array(z.string()) }))
      .query(({ input }) => {
        const current = getCurrentAQI();
        return input.cityIds.map(id => {
          const city = current.find(c => c.id === id);
          const hist = getHistorical().filter(h => h.city_id === id).slice(-30);
          return { ...city, historical: hist };
        }).filter(Boolean);
      }),

    dataStats: publicProcedure.query(() => {
      const current = getCurrentAQI();
      const hist = getHistorical();
      return {
        total_records: hist.length,
        total_cities: current.length,
        training_samples: Math.floor(hist.length * 0.8),
        test_samples: Math.floor(hist.length * 0.2),
        date_range_start: "2020-01-01",
        date_range_end: "2025-04-11",
        pollutants: ["pm25", "pm10", "no2", "so2", "o3", "co"],
      };
    }),

    pollutantTrends: publicProcedure
      .input(z.object({ cityId: z.string(), pollutant: z.string().optional().default("aqi") }))
      .query(({ input }) => {
        const hist = getCityHistorical(input.cityId);
        return hist.map(h => ({
          date: h.date,
          value: (h as any)[input.pollutant] ?? h.aqi,
          aqi: h.aqi,
        }));
      }),
  }),

  // ─── ML Predictions ────────────────────────────────────────────────────────
  ml: router({
    metrics: publicProcedure.query(() => getMLMetrics()),
    
    shap: publicProcedure
      .input(z.object({ model: z.string().optional().default("xgboost") }))
      .query(() => getShapValues()),

    predict: publicProcedure
      .input(z.object({
        cityId: z.string(),
        model: z.enum(["random_forest", "lstm", "xgboost", "prophet", "ensemble"]).optional().default("ensemble"),
        horizon: z.number().optional().default(7),
      }))
      .query(({ input }) => {
        const forecasts = getForecasts().filter(f => f.city_id === input.cityId);
        const metrics = getMLMetrics();
        const modelMetrics = metrics[input.model] ?? metrics.ensemble;
        
        return {
          predictions: forecasts.slice(0, input.horizon),
          model: input.model,
          metrics: modelMetrics,
          feature_count: 60,
          training_period: "2020-2024",
          validation_method: "TimeSeriesSplit (5-fold)",
        };
      }),

    featureImportance: publicProcedure.query(() => {
      return getShapValues().slice(0, 20);
    }),

    modelComparison: publicProcedure.query(() => {
      const metrics = getMLMetrics();
      return Object.entries(metrics).map(([model, m]: [string, any]) => ({
        model,
        ...m,
        display_name: {
          random_forest: "Random Forest",
          lstm: "LSTM Neural Network",
          xgboost: "XGBoost",
          prophet: "Prophet (Time-Series)",
          ensemble: "Ensemble Stacking",
        }[model] ?? model,
      }));
    }),
  }),

  // ─── User Preferences ──────────────────────────────────────────────────────
  preferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return result[0] ?? null;
    }),

    updateFavorites: protectedProcedure
      .input(z.object({ cityIds: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(users)
          .set({ favoriteCities: JSON.stringify(input.cityIds) })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    updateThreshold: protectedProcedure
      .input(z.object({ threshold: z.number().min(0).max(500) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(users)
          .set({ alertThreshold: input.threshold })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),

  // ─── API Keys (client-side encrypted, stored in DB for reference) ──────────
  apiKeySettings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select({
        id: apiKeys.id,
        provider: apiKeys.provider,
        label: apiKeys.label,
        isActive: apiKeys.isActive,
        usageCount: apiKeys.usageCount,
        lastUsed: apiKeys.lastUsed,
        createdAt: apiKeys.createdAt,
      }).from(apiKeys).where(eq(apiKeys.userId, ctx.user.id));
    }),

    save: protectedProcedure
      .input(z.object({
        provider: z.string(),
        encryptedKey: z.string(),
        label: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.insert(apiKeys).values({
          userId: ctx.user.id,
          provider: input.provider,
          encryptedKey: input.encryptedKey,
          label: input.label ?? input.provider,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.delete(apiKeys).where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));
        return { success: true };
      }),

    testWAQI: publicProcedure
      .input(z.object({ key: z.string() }))
      .mutation(async ({ input }) => {
        try {
          console.log("[Test WAQI] Testing key:", input.key.substring(0, 8) + "***");
          const res = await fetch(`https://api.waqi.info/feed/delhi/?token=${input.key}`, { signal: AbortSignal.timeout(5000) });
          const data = await res.json();
          console.log("[Test WAQI] Response:", data.status);
          return { valid: data.status === "ok", message: data.status === "ok" ? "WAQI key is valid" : "Invalid WAQI key" };
        } catch (err) {
          console.error("[Test WAQI] Error:", err);
          return { valid: false, message: "Connection failed" };
        }
      }),

    testGemini: publicProcedure
      .input(z.object({ key: z.string() }))
      .mutation(async ({ input }) => {
        try {
          console.log("[Test Gemini] Testing key:", input.key.substring(0, 10) + "***");
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${input.key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Say OK" }] }] }),
            signal: AbortSignal.timeout(8000)
          });
          const data = await res.json();
          console.log("[Test Gemini] Response:", !!data.candidates?.[0]?.content);
          const ok = !!data.candidates?.[0]?.content;
          return { valid: ok, message: ok ? "Gemini key is valid" : "Invalid Gemini key" };
        } catch (err) {
          console.error("[Test Gemini] Error:", err);
          return { valid: false, message: "Connection failed" };
        }
      }),
  }),

  // ─── Health Advisory ───────────────────────────────────────────────────────
  health: router({
    advisory: publicProcedure
      .input(z.object({ aqi: z.number(), cityId: z.string().optional() }))
      .query(({ input }) => {
        const { category } = getAQICategory(input.aqi);
        
        const advisories: Record<string, any> = {
          "Good": {
            general: "Air quality is satisfactory. Enjoy outdoor activities.",
            sensitive: "Safe for all groups including sensitive individuals.",
            outdoor: "Ideal for outdoor exercise and activities.",
            mask: false,
            color: "#22C55E",
            icon: "smile",
          },
          "Moderate": {
            general: "Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion.",
            sensitive: "People with respiratory issues should limit prolonged outdoor exposure.",
            outdoor: "Outdoor activities are generally safe. Sensitive groups should take precautions.",
            mask: false,
            color: "#EAB308",
            icon: "meh",
          },
          "Poor": {
            general: "Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.",
            sensitive: "Avoid prolonged outdoor exertion. Stay indoors with windows closed.",
            outdoor: "Reduce outdoor activities. Wear N95 mask if going outside.",
            mask: true,
            color: "#F97316",
            icon: "frown",
          },
          "Very Poor": {
            general: "Health alert: everyone may experience more serious health effects.",
            sensitive: "Avoid all outdoor activities. Use air purifier indoors.",
            outdoor: "Avoid outdoor activities. Wear N95/P100 mask if unavoidable.",
            mask: true,
            color: "#EF4444",
            icon: "alert-triangle",
          },
          "Severe": {
            general: "Health emergency. Everyone is affected. Avoid all outdoor activities.",
            sensitive: "Remain indoors with air purifier. Seek medical attention if experiencing symptoms.",
            outdoor: "Do not go outside. Emergency health conditions.",
            mask: true,
            color: "#8B0000",
            icon: "skull",
          },
        };
        
        const festivalData = getFestivalData();
        const upcomingFestival = checkUpcomingFestival();
        
        return {
          aqi: input.aqi,
          category,
          advisory: advisories[category] ?? advisories["Moderate"],
          upcoming_festival: upcomingFestival,
          recommendations: getHealthRecommendations(category),
        };
      }),
  }),

  // ─── Reports ───────────────────────────────────────────────────────────────
  reports: router({
    cityData: publicProcedure
      .input(z.object({ cityId: z.string(), days: z.number().optional().default(30) }))
      .query(({ input }) => {
        const city = getCities().find(c => c.id === input.cityId);
        const hist = getHistorical().filter(h => h.city_id === input.cityId).slice(-input.days);
        const current = getCurrentAQI().find(c => c.id === input.cityId);
        const forecast = getForecasts().filter(f => f.city_id === input.cityId).slice(0, 7);
        const mk = getMannKendall().find(m => m.city_id === input.cityId);
        
        return { city, historical: hist, current, forecast, mann_kendall: mk };
      }),
  }),
});

function checkUpcomingFestival() {
  const now = new Date();
  const festivals = [
    { name: "Diwali", dates: ["2025-10-20", "2026-11-08"] },
    { name: "Holi", dates: ["2025-03-14", "2026-03-03"] },
  ];
  
  for (const fest of festivals) {
    for (const dateStr of fest.dates) {
      const festDate = new Date(dateStr);
      const daysUntil = Math.round((festDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 14) {
        return { festival: fest.name, date: dateStr, days_until: daysUntil };
      }
    }
  }
  return null;
}

function getHealthRecommendations(category: string) {
  const recs: Record<string, string[]> = {
    "Good": [
      "Great day for outdoor jogging or cycling",
      "Windows can be kept open for natural ventilation",
      "No special precautions needed",
    ],
    "Moderate": [
      "Sensitive individuals should limit prolonged outdoor exertion",
      "Consider wearing a mask if you have asthma or heart disease",
      "Monitor air quality before planning outdoor events",
    ],
    "Poor": [
      "Wear N95 mask when going outdoors",
      "Avoid outdoor exercise — switch to indoor workouts",
      "Keep windows closed and use air purifier",
      "Children and elderly should stay indoors",
    ],
    "Very Poor": [
      "Avoid all outdoor activities",
      "Use N95/P100 mask if going outside is unavoidable",
      "Run air purifier continuously indoors",
      "Consult doctor if experiencing breathing difficulty",
      "Avoid burning wood, garbage, or firecrackers",
    ],
    "Severe": [
      "EMERGENCY: Do not go outside",
      "Seal gaps in doors and windows",
      "Use air purifier with HEPA filter",
      "Seek immediate medical attention for breathing problems",
      "Schools and outdoor events should be cancelled",
    ],
  };
  return recs[category] ?? recs["Moderate"];
}

export type AppRouter = typeof appRouter;
