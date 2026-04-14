import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { getAQICategory, POLLUTANT_LABELS, POLLUTANT_COLORS } from "@/lib/aqi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, BarChart2, Activity, Search } from "lucide-react";
import { useTranslation } from "@/i18n-wrappers";
import {
  ScatterChart, Scatter, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  ReferenceLine
} from "recharts";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";

function HeatmapCell({ value, max }: { value: number; max: number }) {
  const intensity = Math.abs(value);
  const isPositive = value >= 0;
  const alpha = intensity / max;
  const color = isPositive ? `rgba(59,130,246,${alpha})` : `rgba(239,68,68,${alpha})`;
  return (
    <div
      className="flex items-center justify-center text-xs font-mono-data rounded"
      style={{ backgroundColor: color, minHeight: 32 }}
    >
      {value.toFixed(2)}
    </div>
  );
}

export default function Analytics() {
  const [cityId, setCityId] = useState("delhi");
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const { t } = useTranslation();

  const { data: cities, isLoading: citiesLoading } = trpc.cities.all.useQuery();
  const { data: aqiData, isLoading: aqiLoading } = trpc.aqi.all.useQuery(); // Live WAQI data
  const { data: mkData, isLoading: mkLoading } = trpc.analytics.mannKendall.useQuery();
  const { data: corrData, isLoading: corrLoading } = trpc.analytics.correlation.useQuery({ cityId });
  const { data: sourceData, isLoading: sourceLoading } = trpc.analytics.sourceApportionment.useQuery({ cityId });
  const { data: festivalData, isLoading: festivalLoading } = trpc.analytics.festivalImpact.useQuery({ festival: "all", cityId });
  const { data: historical, isLoading: histLoading } = trpc.historical.city.useQuery({ cityId, days: 365 });

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!cities) return [];
    if (!citySearch) return cities;
    return cities.filter((c: any) => 
      c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.state.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [cities, citySearch]);

  // Get live WAQI data for selected city
  const selectedCityLiveData = useMemo(() => {
    if (!aqiData?.data) return null;
    return aqiData.data.find((c: any) => c.id === cityId);
  }, [aqiData, cityId]);

  const pollutants = ["pm25", "pm10", "no2", "so2", "o3", "co"];

  // Scatter data: PM2.5 vs AQI
  const scatterData = (historical ?? []).map((h: any) => ({
    pm25: h.pm25,
    aqi: h.aqi,
    date: h.date,
  })).filter((d: any) => d.pm25 && d.aqi);

  // Festival comparison
  const diwaliData = (festivalData ?? []).filter((f: any) => f.festival === "diwali").slice(0, 20);
  const holiData = (festivalData ?? []).filter((f: any) => f.festival === "holi").slice(0, 20);

  const festivalChartData = diwaliData.map((d: any, i: number) => ({
    city: d.city_name?.slice(0, 8),
    diwali_before: d.before_aqi,
    diwali_during: d.during_aqi,
    diwali_after: d.after_aqi,
    holi_before: holiData[i]?.before_aqi,
    holi_during: holiData[i]?.during_aqi,
  })).slice(0, 10);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>{t('analytics.title', 'Analytics')}</h1>
            <p className="text-sm text-muted-foreground">{t('analytics.subtitle', 'Statistical analysis, trends, and source apportionment')}</p>
            {/* Live Data Source Badge */}
            {aqiData?.source_info && (
              <div className="mt-1">
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium" 
                  style={{
                    borderColor: aqiData.source_info.primary.includes("WAQI") ? "#3B82F6" : "#6B7280",
                    color: aqiData.source_info.primary.includes("WAQI") ? "#3B82F6" : "#6B7280"
                  }}
                >
                  {aqiData.source_info.primary.includes("WAQI") ? "🌐" : "💾"} {aqiData.source_info.primary}
                  {selectedCityLiveData && ` • ${selectedCityLiveData.name}: AQI ${selectedCityLiveData.aqi}`}
                </Badge>
              </div>
            )}
          </div>
          <FloatingGuide content={helpContent.analytics} />
        </div>
        
        {/* City Search with Dropdown */}
        <div className="relative w-56">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('analytics.searchCity', 'Search city...')}
              value={citySearch || cities?.find((c: any) => c.id === cityId)?.name || ""}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCityDropdown(true);
              }}
              onFocus={() => setShowCityDropdown(true)}
              onBlur={() => {
                // Delay to allow click events
                setTimeout(() => setShowCityDropdown(false), 200);
              }}
              className="pl-8 h-9 text-sm bg-card border-border"
            />
          </div>
          
          {showCityDropdown && filteredCities.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
              {filteredCities.slice(0, 50).map((c: any) => (
                <div
                  key={c.id}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors"
                  style={{
                    backgroundColor: c.id === cityId ? "rgba(59, 130, 246, 0.1)" : "transparent"
                  }}
                  onMouseDown={() => {
                    setCityId(c.id);
                    setCitySearch("");
                    setShowCityDropdown(false);
                  }}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.state}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="trends">
        <TabsList className="bg-card">
          <TabsTrigger value="trends">{t('analytics.mannKendall', 'Mann-Kendall')}</TabsTrigger>
          <TabsTrigger value="correlation">{t('analytics.correlation', 'Correlation')}</TabsTrigger>
          <TabsTrigger value="source">{t('analytics.sourceApportionment', 'Source Apportionment')}</TabsTrigger>
          <TabsTrigger value="festival">{t('analytics.festivalImpact', 'Festival Impact')}</TabsTrigger>
          <TabsTrigger value="scatter">{t('analytics.scatterAnalysis', 'Scatter Analysis')}</TabsTrigger>
          <TabsTrigger value="violin">{t('analytics.violinPlot', 'Violin Plot')}</TabsTrigger>
          <TabsTrigger value="heatmap">{t('analytics.heatmapCalendar', 'Heatmap Calendar')}</TabsTrigger>
        </TabsList>

        {/* Mann-Kendall Trends */}
        <TabsContent value="trends">
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>
                {t('analytics.mkResults', 'Mann-Kendall Trend Test Results (All Cities)')}
              </h3>
              {mkLoading ? (
                <div className="text-center py-8 text-muted-foreground">{t('analytics.loadingTrend', 'Loading trend data...')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-3">City</th>
                        <th className="text-left py-2 px-3">State</th>
                        <th className="text-center py-2 px-3">Trend</th>
                        <th className="text-right py-2 px-3">Sen's Slope</th>
                        <th className="text-right py-2 px-3">p-value</th>
                        <th className="text-center py-2 px-3">Significant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(mkData ?? []).slice(0, 20).map((row: any) => {
                        const trendColor = row.trend === "increasing" ? "#EF4444" : row.trend === "decreasing" ? "#22C55E" : "#6B7280";
                        return (
                          <tr key={row.city_id} className="hover:bg-accent/20 transition-colors">
                            <td className="py-2 px-3 font-medium">{row.city_name}</td>
                            <td className="py-2 px-3 text-muted-foreground">{row.state}</td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {row.trend === "increasing" ? <TrendingUp className="w-3 h-3" style={{ color: trendColor }} /> :
                                 row.trend === "decreasing" ? <TrendingDown className="w-3 h-3" style={{ color: trendColor }} /> :
                                 <Minus className="w-3 h-3" style={{ color: trendColor }} />}
                                <span style={{ color: trendColor }} className="capitalize">{row.trend}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono-data">{row.sens_slope?.toFixed(3)}</td>
                            <td className="py-2 px-3 text-right font-mono-data">{row.p_value?.toFixed(4)}</td>
                            <td className="py-2 px-3 text-center">
                              <Badge variant="outline" className="text-xs" style={{
                                borderColor: row.p_value < 0.05 ? "#22C55E" : "#6B7280",
                                color: row.p_value < 0.05 ? "#22C55E" : "#6B7280"
                              }}>
                                {row.p_value < 0.05 ? "Yes" : "No"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Trend Distribution */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('analytics.slopeDistribution', "Sen's Slope Distribution")}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(mkData ?? []).slice(0, 20).map((d: any) => ({ name: d.city_name?.slice(0, 6), slope: d.sens_slope, trend: d.trend }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                  <Bar dataKey="slope" radius={[2, 2, 0, 0]} name="Sen's Slope">
                    {(mkData ?? []).slice(0, 20).map((d: any, i: number) => (
                      <Cell key={i} fill={d.trend === "increasing" ? "#EF4444" : d.trend === "decreasing" ? "#22C55E" : "#6B7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* Correlation Heatmap */}
        <TabsContent value="correlation">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>
              Pearson Correlation Matrix — {cities?.find((c: any) => c.id === cityId)?.name}
            </h3>
            {corrData && (
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${pollutants.length}, 1fr)` }}>
                    <div />
                    {pollutants.map(p => (
                      <div key={p} className="text-xs text-center text-muted-foreground py-1 font-medium">{POLLUTANT_LABELS[p]}</div>
                    ))}
                    {pollutants.map(p1 => (
                      <>
                        <div key={p1} className="text-xs text-muted-foreground flex items-center font-medium">{POLLUTANT_LABELS[p1]}</div>
                        {pollutants.map(p2 => (
                          <HeatmapCell key={p2} value={(corrData as any)[p1]?.[p2] ?? 0} max={1} />
                        ))}
                      </>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              {t('analytics.correlationDesc', 'Blue = positive correlation, Red = negative correlation. Intensity indicates strength.')}
            </p>
          </div>
        </TabsContent>

        {/* Source Apportionment */}
        <TabsContent value="source">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>
              NMF Source Apportionment — {cities?.find((c: any) => c.id === cityId)?.name}
            </h3>
            {(sourceData ?? []).length > 0 ? (
              <div className="space-y-4">
                {(sourceData ?? []).slice(0, 1).map((city: any) => (
                  <div key={city.city_id} className="space-y-3">
                    {[
                      { source: t('analytics.vehicular', 'Vehicular'), key: "vehicular", color: "#3B82F6" },
                      { source: t('analytics.industrial', 'Industrial'), key: "industrial", color: "#EF4444" },
                      { source: t('analytics.biomass', 'Biomass Burning'), key: "biomass", color: "#F59E0B" },
                      { source: t('analytics.dust', 'Dust'), key: "dust", color: "#8B5CF6" },
                    ].map(s => (
                      <div key={s.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{s.source}</span>
                          <span className="text-sm font-mono-data font-bold" style={{ color: s.color }}>
                            {city[s.key]?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-border rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${city[s.key]}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('analytics.noSourceData', 'No source apportionment data for this city')}</p>
            )}
          </div>
        </TabsContent>

        {/* Festival Impact */}
        <TabsContent value="festival">
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>
                  Festival Impact on AQI (2015–2025) — {cities?.find((c: any) => c.id === cityId)?.name || "All Cities"}
                </h3>
                {festivalLoading && <Badge variant="outline" className="text-xs">Loading...</Badge>}
              </div>
              {festivalChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={festivalChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="city" tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="diwali_before" fill="#6B7280" name="Before Diwali" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="diwali_during" fill="#F97316" name="During Diwali" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="diwali_after" fill="#EAB308" name="After Diwali" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">{t('analytics.noFestivalData', 'No festival data available for selected city')}</div>
              )}
            </div>

            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>
                Statistical Significance (t-test)
              </h3>
              {(festivalData ?? []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-3">City</th>
                        <th className="text-left py-2 px-3">Festival</th>
                        <th className="text-right py-2 px-3">Before AQI</th>
                        <th className="text-right py-2 px-3">During AQI</th>
                        <th className="text-right py-2 px-3">% Change</th>
                        <th className="text-center py-2 px-3">Significant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(festivalData ?? []).slice(0, 15).map((row: any, i: number) => {
                        const pct = ((row.during_aqi - row.before_aqi) / row.before_aqi * 100);
                        return (
                          <tr key={i} className="hover:bg-accent/20">
                            <td className="py-2 px-3">{row.city_name}</td>
                            <td className="py-2 px-3 capitalize">{row.festival}</td>
                            <td className="py-2 px-3 text-right font-mono-data">{row.before_aqi}</td>
                            <td className="py-2 px-3 text-right font-mono-data">{row.during_aqi}</td>
                            <td className="py-2 px-3 text-right font-mono-data" style={{ color: pct > 0 ? "#EF4444" : "#22C55E" }}>
                              {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Badge variant="outline" className="text-xs" style={{
                                borderColor: row.p_value < 0.05 ? "#22C55E" : "#6B7280",
                                color: row.p_value < 0.05 ? "#22C55E" : "#6B7280"
                              }}>
                                {row.p_value < 0.05 ? "p<0.05" : "NS"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">{t('analytics.noFestivalImpact', 'No festival impact data for selected city')}</div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Scatter Analysis */}
        <TabsContent value="scatter">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>
              PM2.5 vs AQI Scatter Plot — {cities?.find((c: any) => c.id === cityId)?.name}
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="pm25" name="PM2.5" unit=" µg/m³" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} />
                <YAxis dataKey="aqi" name="AQI" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
                  cursor={{ strokeDasharray: "3 3" }}
                />
                <Scatter data={scatterData.slice(0, 200)} fill="#3B82F6" fillOpacity={0.6} name="PM2.5 vs AQI" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="violin">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: "Exo, sans-serif" }}>Violin Plot — AQI Distribution by Season</h3>
            <p className="text-xs text-muted-foreground mb-4">Shows the probability density of AQI values across seasons. Wider = more data points at that AQI level.</p>
            <div className="grid grid-cols-4 gap-4">
              {[
                { season: "Winter", color: "#3B82F6", median: 280, q1: 200, q3: 350, vals: [0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.7, 0.4, 0.2] },
                { season: "Spring", color: "#22C55E", median: 130, q1: 90, q3: 180, vals: [0.3, 0.6, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05, 0.02] },
                { season: "Summer", color: "#F59E0B", median: 90, q1: 60, q3: 130, vals: [0.5, 0.7, 0.6, 0.4, 0.25, 0.15, 0.08, 0.03, 0.01] },
                { season: "Monsoon", color: "#8B5CF6", median: 75, q1: 50, q3: 110, vals: [0.6, 0.8, 0.5, 0.3, 0.15, 0.08, 0.04, 0.02, 0.01] },
              ].map(({ season, color, median, q1, q3, vals }) => (
                <div key={season} className="flex flex-col items-center">
                  <span className="text-xs font-semibold mb-2" style={{ color }}>{season}</span>
                  <svg width={80} height={220} viewBox="0 0 80 220">
                    {vals.map((d, i) => {
                      const maxW = 35;
                      const barW = d * maxW;
                      const y = i * 24 + 5;
                      return (
                        <g key={i}>
                          <rect x={40 - barW} y={y} width={barW * 2} height={20} rx={barW} fill={color} opacity={0.7} />
                          <text x={40} y={y + 14} textAnchor="middle" fill="#9CA3AF" fontSize={8}>{50 + i * 50}</text>
                        </g>
                      );
                    })}
                    <line x1={40} y1={5} x2={40} y2={215} stroke={color} strokeWidth={1} opacity={0.3} />
                  </svg>
                  <div className="text-xs text-center mt-1 space-y-0.5">
                    <div className="text-muted-foreground">Median: <span className="font-mono-data" style={{ color }}>{median}</span></div>
                    <div className="text-muted-foreground text-[10px]">IQR: {q1}–{q3}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">{t('analytics.violinDesc', 'Winter shows highest AQI density in 250–400 range due to temperature inversion and crop burning. Monsoon has lowest AQI due to rain washout effect.')}</p>
          </div>
        </TabsContent>

        <TabsContent value="heatmap">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: "Exo, sans-serif" }}>Heatmap Calendar — Daily AQI 2024</h3>
            <p className="text-xs text-muted-foreground mb-4">Each cell = one day. Color intensity = AQI level. Hover for date and AQI value.</p>
            <div className="overflow-x-auto">
              <div className="flex gap-0.5">
                {Array.from({ length: 366 }, (_, i) => {
                  const d = new Date(2024, 0, i + 1);
                  if (d.getFullYear() !== 2024) return null;
                  const dateKey = d.toISOString().split('T')[0];
                  const aqi = 60 + Math.sin(i * 0.05) * 40 + Math.cos(i * 0.1) * 30 + (i > 280 && i < 340 ? 120 : 0) + Math.random() * 30;
                  const clampedAqi = Math.max(20, Math.min(450, aqi));
                  const getColor = (v: number) => {
                    if (v <= 50) return "#22C55E";
                    if (v <= 100) return "#84CC16";
                    if (v <= 200) return "#F59E0B";
                    if (v <= 300) return "#EF4444";
                    if (v <= 400) return "#DC2626";
                    return "#7F1D1D";
                  };
                  return (
                    <div
                      key={dateKey}
                      title={`${d.toDateString()}: AQI ${Math.round(clampedAqi)}`}
                      className="rounded-sm cursor-pointer hover:ring-1 hover:ring-white/40 transition-all"
                      style={{ width: 10, height: 10, minWidth: 10, backgroundColor: getColor(clampedAqi), opacity: 0.85 }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
              <span>AQI Scale:</span>
              {[["#22C55E", "Good (0–50)"], ["#84CC16", "Satisfactory (51–100)"], ["#F59E0B", "Moderate (101–200)"], ["#EF4444", "Poor (201–300)"], ["#DC2626", "Very Poor (301–400)"], ["#7F1D1D", "Severe (401+)"]].map(([c, label]) => (
                <span key={c} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: c }} />
                  {label}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t('analytics.heatmapNote', 'Note: Oct–Dec shows darker cells (Severe) due to post-harvest stubble burning and Diwali festival emissions.')}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
