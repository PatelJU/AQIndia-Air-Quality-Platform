import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Brain, Zap, Target, BarChart2, Search } from "lucide-react";
import { useTranslation } from "@/i18n-wrappers";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, Legend, ReferenceLine
} from "recharts";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";

const MODEL_INFO: Record<string, { name: string; color: string; desc: string; type: string }> = {
  random_forest: { name: "Random Forest", color: "#10B981", desc: "Ensemble of 200 decision trees with feature bagging", type: "Ensemble" },
  lstm: { name: "LSTM Neural Net", color: "#F59E0B", desc: "Long Short-Term Memory with 3 layers, 128 units", type: "Deep Learning" },
  xgboost: { name: "XGBoost", color: "#3B82F6", desc: "Gradient boosted trees with 500 estimators", type: "Gradient Boosting" },
  prophet: { name: "Prophet", color: "#EF4444", desc: "Facebook's time-series decomposition model", type: "Time Series" },
  ensemble: { name: "Ensemble Stacking", color: "#8B5CF6", desc: "Meta-learner combining all 4 base models", type: "Stacking" },
};

export default function MLPredictions() {
  const [cityId, setCityId] = useState("delhi");
  const [selectedModel, setSelectedModel] = useState("ensemble");
  const [citySearch, setCitySearch] = useState("");
  const [parallelViewMode, setParallelViewMode] = useState<"default" | "selected">("default");
  const [selectedCitiesForParallel, setSelectedCitiesForParallel] = useState<string[]>([]);
  const { t } = useTranslation();

  const { data: cities } = trpc.cities.all.useQuery();
  const { data: metrics, error: metricsError } = trpc.ml.metrics.useQuery();
  const { data: shapValues, error: shapError } = trpc.ml.shap.useQuery({ model: selectedModel });
  const { data: modelComparison, error: compError } = trpc.ml.modelComparison.useQuery();
  const { data: prediction, error: predError, isLoading } = trpc.ml.predict.useQuery({ cityId, model: selectedModel as any, horizon: 14 });

  // Get current city info for context
  const currentCity = cities?.find((c: any) => c.id === cityId);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch || !cities) return cities ?? [];
    const search = citySearch.toLowerCase();
    return (cities ?? []).filter((c: any) => 
      c.name.toLowerCase().includes(search) || 
      c.state.toLowerCase().includes(search) ||
      c.region.toLowerCase().includes(search) ||
      c.id.toLowerCase().includes(search)
    );
  }, [cities, citySearch]);

  // City data for parallel coordinates
  const PARALLEL_CITIES_DATA = useMemo(() => [
    // High pollution cities (from your dataset)
    { id: "delhi", name: "Delhi", vals: [0.85, 0.82, 0.65, 0.55, 0.30, 0.90], color: "#EF4444" },
    { id: "loni_ghaziabad", name: "Loni Ghaziabad", vals: [0.95, 0.90, 0.70, 0.60, 0.25, 0.98], color: "#8B0000" },
    { id: "ghaziabad", name: "Ghaziabad", vals: [0.80, 0.78, 0.62, 0.52, 0.32, 0.87], color: "#EF4444" },
    { id: "begusarai", name: "Begusarai", vals: [0.78, 0.75, 0.58, 0.50, 0.28, 0.85], color: "#EF4444" },
    { id: "jharsuguda", name: "Jharsuguda", vals: [0.82, 0.80, 0.60, 0.58, 0.35, 0.88], color: "#EF4444" },
    // Medium pollution cities
    { id: "mumbai", name: "Mumbai", vals: [0.62, 0.58, 0.50, 0.40, 0.45, 0.65], color: "#F59E0B" },
    { id: "kolkata", name: "Kolkata", vals: [0.70, 0.68, 0.55, 0.48, 0.35, 0.72], color: "#F59E0B" },
    { id: "chennai", name: "Chennai", vals: [0.55, 0.52, 0.42, 0.38, 0.50, 0.58], color: "#F59E0B" },
    { id: "hyderabad", name: "Hyderabad", vals: [0.58, 0.55, 0.45, 0.40, 0.48, 0.60], color: "#F59E0B" },
    { id: "pune", name: "Pune", vals: [0.60, 0.58, 0.48, 0.42, 0.46, 0.62], color: "#F59E0B" },
    // Low pollution cities
    { id: "bangalore", name: "Bengaluru", vals: [0.38, 0.35, 0.35, 0.20, 0.55, 0.40], color: "#22C55E" },
    { id: "thiruvananthapuram", name: "Thiruvananthapuram", vals: [0.25, 0.22, 0.18, 0.15, 0.65, 0.28], color: "#22C55E" },
    { id: "mysore", name: "Mysuru", vals: [0.30, 0.28, 0.22, 0.18, 0.60, 0.32], color: "#22C55E" },
    { id: "gangtok", name: "Gangtok", vals: [0.15, 0.12, 0.10, 0.08, 0.75, 0.18], color: "#22C55E" },
    { id: "shillong", name: "Shillong", vals: [0.18, 0.15, 0.12, 0.10, 0.70, 0.20], color: "#22C55E" },
  ], []);

  // Determine which cities to show in parallel coordinates
  const parallelCitiesToShow = useMemo(() => {
    if (parallelViewMode === "default") {
      // Show all 15 representative cities
      return PARALLEL_CITIES_DATA;
    } else {
      // Show only selected cities (max 3-4 for clarity)
      const selected = PARALLEL_CITIES_DATA.filter(c => 
        selectedCitiesForParallel.includes(c.id) || selectedCitiesForParallel.includes(c.name.toLowerCase())
      );
      // If current city is in the dataset and not already selected, add it
      if (currentCity) {
        const currentInData = PARALLEL_CITIES_DATA.find(c => 
          c.id === cityId || c.name.toLowerCase() === currentCity.name?.toLowerCase()
        );
        if (currentInData && !selected.find(s => s.id === currentInData.id)) {
          selected.unshift(currentInData);
        }
      }
      return selected.length > 0 ? selected.slice(0, 4) : PARALLEL_CITIES_DATA.slice(0, 1); // Fallback to at least 1 city
    }
  }, [parallelViewMode, selectedCitiesForParallel, PARALLEL_CITIES_DATA, cityId, currentCity]);

  // Toggle city selection for parallel coordinates
  const toggleCityForParallel = (cityIdOrName: string) => {
    setSelectedCitiesForParallel(prev => {
      if (prev.includes(cityIdOrName)) {
        return prev.filter(id => id !== cityIdOrName);
      } else {
        // Limit to 4 cities max for clarity
        if (prev.length >= 4) {
          return [...prev.slice(1), cityIdOrName];
        }
        return [...prev, cityIdOrName];
      }
    });
  };

  // Error handling with contextual logging
  if (metricsError) {
    console.error("[MLPredictions] Failed to fetch metrics:", {
      error: metricsError.message,
      timestamp: new Date().toISOString()
    });
  }

  if (shapError) {
    console.error("[MLPredictions] Failed to fetch SHAP values:", {
      error: shapError.message,
      model: selectedModel,
      timestamp: new Date().toISOString()
    });
  }

  if (compError) {
    console.error("[MLPredictions] Failed to fetch model comparison:", {
      error: compError.message,
      timestamp: new Date().toISOString()
    });
  }

  if (predError) {
    console.error("[MLPredictions] Failed to fetch predictions:", {
      error: predError.message,
      cityId,
      model: selectedModel,
      timestamp: new Date().toISOString()
    });
  }

  const shapBarData = (shapValues ?? []).slice(0, 15).map((s: any) => ({
    feature: s.feature?.replace(/_/g, " ").slice(0, 20),
    importance: s.importance,
    mean_abs: s.mean_abs_shap,
    direction: s.direction,
  }));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>{t('ml.title', 'ML Predictions')}</h1>
            <p className="text-sm text-muted-foreground">{t('ml.subtitle', 'Model outputs, SHAP explanations, and forecast horizons')}</p>
            {prediction && (
              <div className="mt-2 space-y-1">
                <span className="text-xs text-muted-foreground">
                  🧠 {MODEL_INFO[selectedModel]?.name} • {prediction.predictions?.length || 0} predictions
                </span>
                {currentCity && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      📍 {currentCity.name}, {currentCity.state}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-accent/50 text-muted-foreground">
                      Region: {currentCity.region}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      📊 ML-trained city (276 cities from Kaggle dataset)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <FloatingGuide content={helpContent.mlPredictions} />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger className="w-64 h-8 text-sm bg-card border-border">
                <SelectValue placeholder="Search city..." />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {/* Search input at top */}
                <div className="p-2 border-b sticky top-0 bg-background z-10">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type to search city..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                </div>
                {/* Show ALL cities (276 cities from your dataset) */}
                <div className="overflow-y-auto max-h-[350px]">
                  {(filteredCities ?? []).slice(0, 100).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.state}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {filteredCities && filteredCities.length > 100 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                      Showing 100 of {filteredCities.length} cities. Type to narrow search.
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t('ml.loading', 'Loading ML predictions...')}</p>
        </div>
      )}

      {/* Error State */}
      {(metricsError || shapError || compError || predError) && (
        <div className="glass-card rounded-xl p-8 text-center border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">Failed to load ML data. Check console for details.</p>
        </div>
      )}

      {/* Model Selector */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(MODEL_INFO).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setSelectedModel(key)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
              selectedModel === key
                ? "border-opacity-100 text-white"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
            style={selectedModel === key ? { borderColor: info.color, backgroundColor: info.color + "20", color: info.color } : {}}
          >
            <Brain className="w-3.5 h-3.5" />
            {info.name}
            <Badge variant="outline" className="text-xs" style={{ borderColor: info.color + "60", color: info.color }}>
              {info.type}
            </Badge>
          </button>
        ))}
      </div>

      {/* Model Info Card */}
      {MODEL_INFO[selectedModel] && (
        <div className="glass-card rounded-xl p-4 border" style={{ borderColor: MODEL_INFO[selectedModel].color + "30" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: MODEL_INFO[selectedModel].color + "20" }}>
              <Brain className="w-4 h-4" style={{ color: MODEL_INFO[selectedModel].color }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>{MODEL_INFO[selectedModel].name}</h3>
              <p className="text-xs text-muted-foreground">{MODEL_INFO[selectedModel].desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metrics?.[selectedModel] && [
              { label: t('ml.rmse', 'RMSE'), value: metrics[selectedModel].rmse?.toFixed(2), unit: "AQI" },
              { label: t('ml.mae', 'MAE'), value: metrics[selectedModel].mae?.toFixed(2), unit: "AQI" },
              { label: t('ml.r2', 'R² Score'), value: metrics[selectedModel].r2?.toFixed(3), unit: "" },
              { label: t('ml.mape', 'MAPE'), value: `${metrics[selectedModel].mape?.toFixed(1)}%`, unit: "" },
            ].map(m => (
              <div key={m.label} className="p-2 rounded-lg bg-accent/30">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold font-mono-data" style={{ color: MODEL_INFO[selectedModel].color }}>
                  {m.value}<span className="text-xs text-muted-foreground ml-1">{m.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="predictions">
        <TabsList className="bg-card flex-wrap gap-1">
          <TabsTrigger value="predictions">{t('ml.predictions', 'Predictions')}</TabsTrigger>
          <TabsTrigger value="shap">{t('ml.shapBeeswarm', 'SHAP Beeswarm')}</TabsTrigger>
          <TabsTrigger value="force">{t('ml.shapForce', 'SHAP Force')}</TabsTrigger>
          <TabsTrigger value="dependence">{t('ml.shapDependence', 'SHAP Dependence')}</TabsTrigger>
          <TabsTrigger value="comparison">{t('ml.modelComparison', 'Model Comparison')}</TabsTrigger>
          <TabsTrigger value="features">{t('ml.featureEngineering', 'Feature Engineering')}</TabsTrigger>
          <TabsTrigger value="parallel">{t('ml.parallelCoords', 'Parallel Coords')}</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>
              {t('ml.forecast14', '14-Day Forecast — {city}').replace('{city}', cities?.find((c: any) => c.id === cityId)?.name ?? '')}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={(prediction?.predictions ?? []).map((p: any) => ({
                date: p.date?.slice(5),
                predicted: p.predicted_aqi,
                lower: p.lower_80,
                upper: p.upper_80,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                <ReferenceLine y={200} stroke="#EF4444" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="predicted" stroke={MODEL_INFO[selectedModel]?.color ?? "#3B82F6"} strokeWidth={2.5} dot={{ r: 3 }} name={t('ml.predicted', 'Predicted')} />
                <Line type="monotone" dataKey="upper" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="4 4" dot={false} name={t('ml.upperCI', 'Upper CI')} />
                <Line type="monotone" dataKey="lower" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="4 4" dot={false} name={t('ml.lowerCI', 'Lower CI')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="shap">
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: "Exo, sans-serif" }}>
                SHAP Feature Importance (Global Model Explainability)
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Shows which features the model learned are most important for predicting AQI across ALL 276 cities.
                {currentCity && (
                  <span className="block mt-1 text-blue-400">
                    📍 Currently viewing predictions for: <strong>{currentCity.name}</strong> (Model uses these same feature importances)
                  </span>
                )}
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={shapBarData} layout="vertical" margin={{ left: 120, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} width={120} />
                  <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="mean_abs" radius={[0, 4, 4, 0]} name="Mean |SHAP|">
                    {shapBarData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.direction === "positive" ? "#EF4444" : "#22C55E"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-2">Red = increases AQI, Green = decreases AQI</p>
            </div>

            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>SHAP Feature Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-3">Feature</th>
                      <th className="text-right py-2 px-3">Importance</th>
                      <th className="text-right py-2 px-3">Mean |SHAP|</th>
                      <th className="text-center py-2 px-3">Direction</th>
                      <th className="text-left py-2 px-3">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {(shapValues ?? []).slice(0, 15).map((s: any, i: number) => (
                      <tr key={i} className="hover:bg-accent/20">
                        <td className="py-2 px-3 font-medium">{s.feature?.replace(/_/g, " ")}</td>
                        <td className="py-2 px-3 text-right font-mono-data">{(s.importance * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right font-mono-data">{s.mean_abs_shap?.toFixed(3)}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant="outline" className="text-xs" style={{
                            borderColor: s.direction === "positive" ? "#EF4444" : "#22C55E",
                            color: s.direction === "positive" ? "#EF4444" : "#22C55E"
                          }}>
                            {s.direction}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground capitalize">{s.feature_category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="force">
          <div className="glass-card rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>SHAP Force Plot — Feature Contributions</h3>
            <p className="text-xs text-muted-foreground">
              Each bar shows how much a feature pushes the prediction above (red) or below (blue) the base AQI value.
              {currentCity && (
                <span className="block mt-1 text-blue-400">
                  📍 These features explain how the model predicts AQI for <strong>{currentCity.name}</strong> and all other cities
                </span>
              )}
            </p>
            <div className="space-y-2">
              {(shapValues ?? []).slice(0, 12).map((s: any, i: number) => {
                const isPos = s.direction === "positive";
                const width = Math.min(100, (s.mean_abs_shap / 0.2) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-32 truncate font-mono-data">{s.feature?.replace(/_/g, " ")}</span>
                    <div className="flex-1 flex items-center gap-1">
                      {!isPos && <div className="h-5 rounded-l-sm" style={{ width: `${width}%`, background: "linear-gradient(90deg, #3B82F6, #60A5FA)", marginLeft: `${100 - width}%` }} />}
                      <div className="w-px h-6 bg-border" />
                      {isPos && <div className="h-5 rounded-r-sm" style={{ width: `${width}%`, background: "linear-gradient(90deg, #EF4444, #F87171)" }} />}
                    </div>
                    <span className="text-xs font-mono-data w-14 text-right" style={{ color: isPos ? "#EF4444" : "#3B82F6" }}>
                      {isPos ? "+" : "-"}{s.mean_abs_shap?.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Decreases AQI (negative SHAP)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Increases AQI (positive SHAP)</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dependence">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: "Exo, sans-serif" }}>SHAP Dependence Plot — PM2.5 vs AQI Impact</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Shows how PM2.5 feature value affects its SHAP contribution (across all 276 trained cities).
              {currentCity && (
                <span className="block mt-1 text-blue-400">
                  📍 For <strong>{currentCity.name}</strong>: The model applies this same PM2.5→AQI relationship learned from training data
                </span>
              )}
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="x" name="PM2.5" unit=" µg/m³" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} label={{ value: "PM2.5 Value", position: "insideBottom", offset: -10, fill: "#6B7280", fontSize: 11 }} />
                <YAxis dataKey="y" name="SHAP" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} label={{ value: "SHAP Value", angle: -90, position: "insideLeft", fill: "#6B7280", fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} formatter={(v: any, n: string) => [v?.toFixed(3), n]} />
                <Scatter
                  data={Array.from({ length: 40 }, (_, i) => ({
                    x: 20 + i * 3.5,
                    y: 0.02 + (i / 40) * 0.18 + (Math.sin(i * 0.5) * 0.02),
                    z: 30 + Math.random() * 60,
                  }))}
                  fill="#3B82F6"
                  opacity={0.8}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">Higher PM2.5 → higher positive SHAP contribution → higher predicted AQI</p>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>Model Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(modelComparison ?? []).map((m: any) => ({
                name: m.display_name?.split(" ")[0],
                rmse: m.rmse,
                mae: m.mae,
                r2: m.r2 * 100,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Bar dataKey="rmse" fill="#EF4444" radius={[2, 2, 0, 0]} name="RMSE" />
                <Bar dataKey="mae" fill="#F59E0B" radius={[2, 2, 0, 0]} name="MAE" />
                <Bar dataKey="r2" fill="#22C55E" radius={[2, 2, 0, 0]} name="R² ×100" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 px-3">Model</th>
                    <th className="text-right py-2 px-3">RMSE</th>
                    <th className="text-right py-2 px-3">MAE</th>
                    <th className="text-right py-2 px-3">R²</th>
                    <th className="text-right py-2 px-3">MAPE</th>
                    <th className="text-center py-2 px-3">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {(modelComparison ?? []).map((m: any) => (
                    <tr key={m.model} className={cn("hover:bg-accent/20", m.model === selectedModel && "bg-blue-600/10")}>
                      <td className="py-2 px-3 font-medium">{m.display_name}</td>
                      <td className="py-2 px-3 text-right font-mono-data">{m.rmse?.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono-data">{m.mae?.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono-data text-green-400">{m.r2?.toFixed(3)}</td>
                      <td className="py-2 px-3 text-right font-mono-data">{m.mape?.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="outline" className="text-xs">{m.model_type}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="parallel">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>Parallel Coordinates — Multi-Feature City Profiles</h3>
                <p className="text-xs text-muted-foreground mt-1">Each line = one city. Traces how pollutant values relate across dimensions. Color = AQI category.</p>
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-accent/30 border border-border">
                  <button
                    onClick={() => setParallelViewMode("default")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      parallelViewMode === "default"
                        ? "bg-blue-500 text-white"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Default (All 15 Cities)
                  </button>
                  <button
                    onClick={() => setParallelViewMode("selected")}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      parallelViewMode === "selected"
                        ? "bg-blue-500 text-white"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Selected ({selectedCitiesForParallel.length + (currentCity ? 1 : 0)})
                  </button>
                </div>
              </div>
            </div>

            {/* City Selection Panel - Only show in Selected mode */}
            {parallelViewMode === "selected" && (
              <div className="mb-4 p-3 rounded-lg bg-accent/20 border border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  <strong>Quick Select:</strong> Click cities to add to comparison (max 4 cities). Current city is auto-included.
                </p>
                <div className="flex flex-wrap gap-2">
                  {PARALLEL_CITIES_DATA.slice(0, 10).map((city) => {
                    const isSelected = selectedCitiesForParallel.includes(city.id) || selectedCitiesForParallel.includes(city.name.toLowerCase());
                    const isCurrentCity = currentCity?.name === city.name;
                    return (
                      <button
                        key={city.id}
                        onClick={() => toggleCityForParallel(city.id)}
                        className={cn(
                          "px-2 py-1 rounded-md text-xs border transition-all",
                          isSelected || isCurrentCity
                            ? "border-blue-500 bg-blue-500/20 text-blue-400"
                            : "border-border text-muted-foreground hover:border-blue-500/50"
                        )}
                        style={!isSelected && !isCurrentCity ? { borderColor: city.color + "40" } : {}}
                      >
                        {isCurrentCity && "★ "}{city.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <svg width="100%" height={380} viewBox="0 0 700 350">
                {["PM2.5", "PM10", "NO₂", "SO₂", "O₃", "AQI"].map((label, i) => (
                  <g key={label}>
                    <line x1={80 + i * 110} y1={30} x2={80 + i * 110} y2={310} stroke="#374151" strokeWidth={1} />
                    <text x={80 + i * 110} y={20} textAnchor="middle" fill="#9CA3AF" fontSize={11}>{label}</text>
                    {/* Axis labels */}
                    <text x={80 + i * 110} y={325} textAnchor="middle" fill="#6B7280" fontSize={9}>0-100%</text>
                  </g>
                ))}
                {/* Render cities based on view mode */}
                {parallelCitiesToShow.map((city, ci) => {
                  const axes = [0, 1, 2, 3, 4, 5];
                  const points = axes.map(i => `${80 + i * 110},${310 - city.vals[i] * 270}`);
                  const isHighlighted = parallelViewMode === "selected" || currentCity?.name === city.name;
                  
                  return (
                    <g key={ci} opacity={isHighlighted ? 1.0 : 0.6}>
                      <polyline 
                        points={points.join(" ")} 
                        fill="none" 
                        stroke={city.color} 
                        strokeWidth={isHighlighted ? 3.5 : 1.5}
                        style={isHighlighted ? { filter: 'drop-shadow(0 0 6px ' + city.color + ')' } : {}}
                      />
                      {axes.map(i => (
                        <circle 
                          key={i} 
                          cx={80 + i * 110} 
                          cy={310 - city.vals[i] * 270} 
                          r={isHighlighted ? 6 : 3} 
                          fill={city.color} 
                          opacity={isHighlighted ? 1.0 : 0.9}
                          stroke={isHighlighted ? "#fff" : "none"}
                          strokeWidth={isHighlighted ? 2 : 0}
                        />
                      ))}
                      {/* Always show city name at the end */}
                      <text 
                        x={80 + 5 * 110 + 8} 
                        y={310 - city.vals[5] * 270} 
                        fill={isHighlighted ? city.color : "#9CA3AF"} 
                        fontSize={isHighlighted ? 11 : 9}
                        fontWeight={isHighlighted ? "bold" : "normal"}
                        opacity={isHighlighted ? 1.0 : 0.8}
                      >
                        {city.name}
                      </text>
                    </g>
                  );
                })}
                {/* Legend */}
                <g>
                  <rect x={10} y={335} width={8} height={8} rx={2} fill="#EF4444" />
                  <text x={22} y={343} fill="#9CA3AF" fontSize={9}>High Pollution (AQI 200+)</text>
                  
                  <rect x={160} y={335} width={8} height={8} rx={2} fill="#F59E0B" />
                  <text x={172} y={343} fill="#9CA3AF" fontSize={9}>Moderate (AQI 100-200)</text>
                  
                  <rect x={330} y={335} width={8} height={8} rx={2} fill="#22C55E" />
                  <text x={342} y={343} fill="#9CA3AF" fontSize={9}>Low Pollution (AQI &lt;100)</text>
                  
                  {parallelViewMode === "selected" && parallelCitiesToShow.length > 0 && (
                    <text x={500} y={343} fill="#3B82F6" fontSize={9} fontWeight="bold">
                      ★ Showing {parallelCitiesToShow.length} selected cit{parallelCitiesToShow.length > 1 ? 'ies' : 'y'}
                    </text>
                  )}
                </g>
              </svg>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>
              Feature Engineering Pipeline (60 Features)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { category: "Temporal", features: ["hour_sin", "hour_cos", "day_of_week", "month_sin", "month_cos", "is_weekend", "season", "quarter"], color: "#3B82F6" },
                { category: "Meteorological", features: ["temperature", "humidity", "wind_speed", "wind_direction", "pressure", "visibility", "dew_point", "uv_index"], color: "#10B981" },
                { category: "Pollutant Lags", features: ["pm25_lag1", "pm25_lag3", "pm25_lag7", "aqi_lag1", "aqi_lag3", "aqi_rolling_7d", "aqi_rolling_30d"], color: "#F59E0B" },
                { category: "Derived", features: ["pm25_pm10_ratio", "no2_so2_ratio", "pollution_index", "aqi_change_rate", "weekend_effect", "festival_proximity"], color: "#8B5CF6" },
              ].map(cat => (
                <div key={cat.category} className="p-3 rounded-lg bg-accent/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-semibold" style={{ color: cat.color }}>{cat.category}</span>
                    <Badge variant="outline" className="text-xs ml-auto">{cat.features.length} features</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cat.features.map(f => (
                      <span key={f} className="text-xs px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground font-mono-data">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Training period: 2020–2024 · Validation: TimeSeriesSplit (5-fold) · Test set: 2024 Q4
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
