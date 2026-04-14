// AQI utility functions for client-side use

export interface AQICategory {
  category: string;
  color: string;
  bgColor: string;
  description: string;
  textClass: string;
  bgClass: string;
}

export function getAQICategory(aqi: number): AQICategory {
  const capped = Math.min(500, Math.max(0, aqi));
  if (capped <= 50) return {
    category: "Good", color: "#22C55E", bgColor: "rgba(34,197,94,0.15)",
    description: "Air quality is satisfactory",
    textClass: "text-green-400", bgClass: "bg-green-500/10 border-green-500/20"
  };
  if (capped <= 100) return {
    category: "Moderate", color: "#EAB308", bgColor: "rgba(234,179,8,0.15)",
    description: "Air quality is acceptable",
    textClass: "text-yellow-400", bgClass: "bg-yellow-500/10 border-yellow-500/20"
  };
  if (capped <= 200) return {
    category: "Poor", color: "#F97316", bgColor: "rgba(249,115,22,0.15)",
    description: "Sensitive groups may experience effects",
    textClass: "text-orange-400", bgClass: "bg-orange-500/10 border-orange-500/20"
  };
  if (capped <= 300) return {
    category: "Very Poor", color: "#EF4444", bgColor: "rgba(239,68,68,0.15)",
    description: "Everyone may experience health effects",
    textClass: "text-red-400", bgClass: "bg-red-500/10 border-red-500/20"
  };
  return {
    category: "Severe", color: "#8B0000", bgColor: "rgba(139,0,0,0.2)",
    description: "Health emergency — avoid outdoor activities",
    textClass: "text-red-800", bgClass: "bg-red-900/20 border-red-900/30"
  };
}

export function getAQIGradient(aqi: number): string {
  const { color } = getAQICategory(aqi);
  return `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`;
}

export function formatAQI(aqi: number): string {
  return Math.min(500, Math.max(0, Math.round(aqi))).toString();
}

export const AQI_COLORS = {
  Good: "#22C55E",
  Moderate: "#EAB308",
  Poor: "#F97316",
  "Very Poor": "#EF4444",
  Severe: "#8B0000",
};

export const POLLUTANT_UNITS: Record<string, string> = {
  pm25: "µg/m³",
  pm10: "µg/m³",
  no2: "µg/m³",
  so2: "µg/m³",
  o3: "µg/m³",
  co: "mg/m³",
  aqi: "",
};

export const POLLUTANT_LABELS: Record<string, string> = {
  pm25: "PM2.5",
  pm10: "PM10",
  no2: "NO₂",
  so2: "SO₂",
  o3: "O₃",
  co: "CO",
};

export const POLLUTANT_COLORS: Record<string, string> = {
  pm25: "#3B82F6",
  pm10: "#8B5CF6",
  no2: "#F59E0B",
  so2: "#EF4444",
  o3: "#10B981",
  co: "#F97316",
};

export const REGIONS = ["North", "South", "East", "West", "Central", "Northeast"];

export function getSourceBadgeColor(source: string): string {
  const map: Record<string, string> = {
    "WAQI": "#3B82F6",
    "Open-Meteo": "#10B981",
    "CPCB": "#F59E0B",
    "NASA": "#8B5CF6",
    "Cached (Open-Meteo)": "#6B7280",
    "historical_cpcb": "#F59E0B",
  };
  return map[source] ?? "#6B7280";
}
