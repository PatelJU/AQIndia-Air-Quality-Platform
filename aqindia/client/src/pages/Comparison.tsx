import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { getAQICategory, POLLUTANT_LABELS, POLLUTANT_COLORS } from "@/lib/aqi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, X, GitCompare } from "lucide-react";
import { useTranslation } from "@/i18n-wrappers";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell
} from "recharts";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

// Helper to load/save selected cities from localStorage
const STORAGE_KEY = "aqindia_comparison_cities";

function getStoredCities(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("[Comparison] Failed to load stored cities:", e);
  }
  return ["delhi", "mumbai", "bangalore"]; // Default fallback
}

function saveStoredCities(cities: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
  } catch (e) {
    console.error("[Comparison] Failed to save cities:", e);
  }
}

export default function Comparison() {
  // Load from localStorage on first render, persist across navigation
  const [selectedCities, setSelectedCities] = useState<string[]>(getStoredCities);
  const [addCity, setAddCity] = useState("");
  const { t } = useTranslation();

  // Save to localStorage whenever selectedCities changes
  useEffect(() => {
    saveStoredCities(selectedCities);
  }, [selectedCities]);

  const { data: cities } = trpc.cities.all.useQuery();
  const { data: compData, isLoading, error } = trpc.analytics.cityComparison.useQuery({ cityIds: selectedCities });

  // Error handling with contextual logging
  if (error) {
    console.error("[Comparison] Failed to fetch comparison data:", {
      error: error.message,
      selectedCities,
      cityCount: selectedCities.length,
      timestamp: new Date().toISOString()
    });
  }

  const removeCity = (id: string) => setSelectedCities(prev => prev.filter(c => c !== id));
  const addCityHandler = () => {
    if (addCity && !selectedCities.includes(addCity) && selectedCities.length < 5) {
      setSelectedCities(prev => [...prev, addCity]);
      setAddCity("");
    }
  };

  const radarData = ["pm25", "pm10", "no2", "so2", "o3"].map(p => {
    const row: Record<string, any> = { subject: POLLUTANT_LABELS[p] };
    (compData ?? []).forEach((c: any) => {
      row[c.name] = c[p] ?? 0;
    });
    return row;
  });

  const barData = (compData ?? []).map((c: any) => ({
    name: c.name,
    aqi: c.aqi,
    pm25: c.pm25,
    pm10: c.pm10,
    no2: c.no2,
    color: getAQICategory(c.aqi).color,
  }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>{t('comparison.title', 'City Comparison')}</h1>
            <p className="text-sm text-muted-foreground">{t('comparison.subtitle', 'Side-by-side comparison of up to 5 cities')}</p>
            {compData && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  🔄 Comparing {(compData as any[]).length} cities • Updated {new Date().toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          <FloatingGuide content={helpContent.comparison} />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t('comparison.loading', 'Loading comparison data...')}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card rounded-xl p-8 text-center border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">{t('comparison.error', 'Failed to load comparison')}: {error.message}</p>
        </div>
      )}

      {/* City Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {selectedCities.map((id, i) => {
          const city = cities?.find((c: any) => c.id === id);
          return (
            <div key={id} className="flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm" style={{ borderColor: COLORS[i], color: COLORS[i], background: COLORS[i] + "15" }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              {city?.name ?? id}
              <button onClick={() => removeCity(id)} className="ml-1 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {selectedCities.length < 5 && (
          <div className="flex items-center gap-2">
            <Select value={addCity} onValueChange={setAddCity}>
              <SelectTrigger className="w-44 h-8 text-sm bg-card border-border">
                <SelectValue placeholder={t('comparison.addCity', 'Add city...')} />
              </SelectTrigger>
              <SelectContent>
                {(cities ?? [])
                  .filter((c: any) => !selectedCities.includes(c.id))
                  .map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={addCityHandler} disabled={!addCity} className="gap-1 h-8">
              <Plus className="w-3.5 h-3.5" />
              {t('comparison.add', 'Add')}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {/* AQI Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {(compData ?? []).map((city: any, i: number) => {
              const { color, category } = getAQICategory(city.aqi);
              return (
                <motion.div
                  key={city.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-4 border"
                  style={{ borderColor: COLORS[i] + "40" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm font-semibold truncate" style={{ fontFamily: "Exo, sans-serif" }}>{city.name}</span>
                  </div>
                  <div className="text-3xl font-bold font-mono-data" style={{ color }}>{city.aqi}</div>
                  <Badge variant="outline" className="text-xs mt-1" style={{ borderColor: color, color }}>{category}</Badge>
                  <div className="mt-3 space-y-1 text-xs">
                    {["pm25", "pm10", "no2", "so2"].map(p => (
                      <div key={p} className="flex justify-between">
                        <span className="text-muted-foreground">{POLLUTANT_LABELS[p]}</span>
                        <span className="font-mono-data">{city[p]?.toFixed(1) ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bar Comparison */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('comparison.aqiComparison', 'AQI Comparison')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="aqi" radius={[4, 4, 0, 0]} name="AQI">
                  {barData.map((entry: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Comparison */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('comparison.pollutantProfile', 'Pollutant Profile Comparison')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                {(compData ?? []).map((city: any, i: number) => (
                  <Radar
                    key={city.id}
                    name={city.name}
                    dataKey={city.name}
                    stroke={COLORS[i]}
                    fill={COLORS[i]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
                <Legend />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Historical Trend Comparison */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('comparison.historicalTrend', 'Historical AQI Trend (Last 30 Days)')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                <Legend />
                {(compData ?? []).map((city: any, i: number) => (
                  <Line
                    key={city.id}
                    data={(city.historical ?? []).map((h: any) => ({ date: h.date?.slice(5), aqi: h.aqi }))}
                    type="monotone"
                    dataKey="aqi"
                    stroke={COLORS[i]}
                    strokeWidth={2}
                    dot={false}
                    name={city.name}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* NEW: PM2.5 Comparison */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('comparison.pm25Comparison', 'PM2.5 Levels Comparison (μg/m³)')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Bar dataKey="pm25" radius={[4, 4, 0, 0]} name="PM2.5" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* NEW: PM10 Comparison */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('comparison.pm10Comparison', 'PM10 Levels Comparison (μg/m³)')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Bar dataKey="pm10" radius={[4, 4, 0, 0]} name="PM10" fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* NEW: NO2 & SO2 Grouped Comparison */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('comparison.no2so2Comparison', 'NO₂ & SO₂ Comparison (μg/m³)')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Bar dataKey="no2" radius={[4, 4, 0, 0]} name="NO₂" fill="#8B5CF6" />
                <Bar dataKey="so2" radius={[4, 4, 0, 0]} name="SO₂" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* NEW: Data Table Comparison */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('comparison.detailedTable', 'Detailed Comparison Table')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-3">City</th>
                    <th className="text-right py-2 px-3">AQI</th>
                    <th className="text-right py-2 px-3">PM2.5</th>
                    <th className="text-right py-2 px-3">PM10</th>
                    <th className="text-right py-2 px-3">NO₂</th>
                    <th className="text-right py-2 px-3">SO₂</th>
                    <th className="text-right py-2 px-3">O₃</th>
                    <th className="text-right py-2 px-3">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(compData ?? []).map((city: any, i: number) => {
                    const { color, category } = getAQICategory(city.aqi);
                    return (
                      <tr key={city.id} className="hover:bg-accent/20">
                        <td className="py-2 px-3 font-medium" style={{ color: COLORS[i] }}>{city.name}</td>
                        <td className="py-2 px-3 text-right font-mono-data font-bold" style={{ color }}>{city.aqi}</td>
                        <td className="py-2 px-3 text-right font-mono-data">{city.pm25?.toFixed(1) ?? "—"}</td>
                        <td className="py-2 px-3 text-right font-mono-data">{city.pm10?.toFixed(1) ?? "—"}</td>
                        <td className="py-2 px-3 text-right font-mono-data">{city.no2?.toFixed(1) ?? "—"}</td>
                        <td className="py-2 px-3 text-right font-mono-data">{city.so2?.toFixed(1) ?? "—"}</td>
                        <td className="py-2 px-3 text-right font-mono-data">{city.o3?.toFixed(1) ?? "—"}</td>
                        <td className="py-2 px-3 text-right">
                          <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>{category}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
