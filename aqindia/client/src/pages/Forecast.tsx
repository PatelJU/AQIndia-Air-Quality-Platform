import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { getAQICategory } from "@/lib/aqi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, Calendar, Brain, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/i18n-wrappers";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, Legend, Cell
} from "recharts";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";

const HORIZONS = [
  { value: "24h", label: "24 Hours" },
  { value: "72h", label: "72 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

const MODELS = [
  { value: "ensemble", label: "Ensemble (Best)", color: "#3B82F6" },
  { value: "xgboost", label: "XGBoost", color: "#10B981" },
  { value: "random_forest", label: "Random Forest", color: "#8B5CF6" },
  { value: "lstm", label: "LSTM Neural Net", color: "#F59E0B" },
  { value: "prophet", label: "Prophet", color: "#EF4444" },
];

export default function Forecast() {
  const [cityId, setCityId] = useState("delhi");
  const [horizon, setHorizon] = useState<any>("7d");
  const [model, setModel] = useState("ensemble");
  const { t } = useTranslation();

  const { data: cities } = trpc.cities.all.useQuery();
  const { data: forecast, isLoading, error } = trpc.forecast.city.useQuery({ 
    cityId, 
    horizon,
    model: model as "ensemble" | "xgboost" | "random_forest" | "lstm" | "prophet"
  });
  const { data: mlMetrics, error: metricsError } = trpc.ml.metrics.useQuery();
  const { data: festivalData } = trpc.analytics.festivalImpact.useQuery({ festival: "all" });

  // Error handling with contextual logging
  if (error) {
    console.error("[Forecast] Failed to fetch forecast data:", {
      error: error.message,
      cityId,
      horizon,
      model,
      timestamp: new Date().toISOString()
    });
  }

  if (metricsError) {
    console.error("[Forecast] Failed to fetch ML metrics:", {
      error: metricsError.message,
      timestamp: new Date().toISOString()
    });
  }

  const selectedModel = MODELS.find(m => m.value === model);
  const modelMetrics = mlMetrics?.[model];

  const chartData = (forecast ?? []).map((f: any) => ({
    date: f.date.slice(5),
    predicted: f.predicted_aqi,
    lower80: f.lower_80,
    upper80: f.upper_80,
    lower95: f.lower_95,
    upper95: f.upper_95,
    model: f.model,
    horizon: f.horizon,
  }));

  const upcomingFestival = festivalData?.find((f: any) => {
    const days = Math.round((new Date(f.date).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 14;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>{t('forecast.title', 'AQI Forecast')}</h1>
            <p className="text-sm text-muted-foreground">{t('forecast.subtitle', 'ML-powered predictions with confidence intervals')}</p>
            {forecast && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  🔮 {horizon === '24h' ? '24-hour' : horizon === '72h' ? '72-hour' : horizon === '7d' ? '7-day' : horizon === '30d' ? '30-day' : 'Quarterly'} forecast • {(forecast as any[]).length} predictions
                </span>
              </div>
            )}
          </div>
          <FloatingGuide content={helpContent.forecast} />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t('forecast.loading', 'Loading forecast data...')}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card rounded-xl p-8 text-center border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">{t('forecast.error', 'Failed to load forecast')}: {error.message}</p>
        </div>
      )}

      {/* Festival Warning */}
      {upcomingFestival && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30"
        >
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-300">
            <strong>{upcomingFestival.festival}</strong> approaching in {Math.round((new Date(upcomingFestival.date).getTime() - Date.now()) / 86400000)} days —
            expect AQI spike of +{upcomingFestival.aqi_increase ?? 80}% during festival period
          </p>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <Select value={cityId} onValueChange={setCityId}>
          <SelectTrigger className="w-48 h-8 text-sm bg-card border-border">
            <SelectValue placeholder={t('forecast.selectCity', 'Select city')} />
          </SelectTrigger>
          <SelectContent>
            {/* Show ALL cities (108 cities) */}
            {(cities ?? []).map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          {HORIZONS.map(h => (
            <button
              key={h.value}
              onClick={() => setHorizon(h.value)}
              className={cn(
                "px-3 py-1 text-xs rounded border transition-colors",
                horizon === h.value ? "bg-blue-600/20 border-blue-500 text-blue-400" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {h.label === '24 Hours' ? t('forecast.24h', '24 Hours') :
               h.label === '72 Hours' ? t('forecast.72h', '72 Hours') :
               h.label === '7 Days' ? t('forecast.7d', '7 Days') :
               h.label === '30 Days' ? t('forecast.30d', '30 Days') :
               h.label === 'Quarterly' ? t('forecast.quarterly', 'Quarterly') :
               h.label}
            </button>
          ))}
        </div>

        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="w-44 h-8 text-sm bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map(m => <SelectItem key={m.value} value={m.value}>
              {m.label === 'Ensemble (Best)' ? t('forecast.ensemble', 'Ensemble (Best)') :
               m.label === 'XGBoost' ? t('forecast.xgboost', 'XGBoost') :
               m.label === 'Random Forest' ? t('forecast.randomForest', 'Random Forest') :
               m.label === 'LSTM Neural Net' ? t('forecast.lstm', 'LSTM Neural Net') :
               m.label === 'Prophet' ? t('forecast.prophet', 'Prophet') :
               m.label}
            </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Model Metrics */}
      {modelMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t('forecast.rmse', 'RMSE'), value: modelMetrics.rmse?.toFixed(2), unit: "AQI" },
            { label: t('forecast.mae', 'MAE'), value: modelMetrics.mae?.toFixed(2), unit: "AQI" },
            { label: t('forecast.r2', 'R² Score'), value: modelMetrics.r2?.toFixed(3), unit: "" },
            { label: t('forecast.mape', 'MAPE'), value: `${modelMetrics.mape?.toFixed(1)}`, unit: "%" },
          ].map(m => (
            <div key={m.label} className="glass-card rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-xl font-bold font-mono-data mt-1" style={{ color: selectedModel?.color }}>
                {m.value}<span className="text-xs text-muted-foreground ml-1">{m.unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Main Forecast Chart */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>
            {t('forecast.chartTitle', '{horizon} Forecast — {city}').replace('{horizon}', HORIZONS.find(h => h.value === horizon)?.label ?? '').replace('{city}', cities?.find((c: any) => c.id === cityId)?.name ?? cityId)}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Brain className="w-3.5 h-3.5" />
            <span>{t('forecast.model', 'Model')}: {selectedModel?.label}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="skeleton h-64 rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ci95" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedModel?.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={selectedModel?.color} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="ci80" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedModel?.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={selectedModel?.color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
                formatter={(val: any, name: string) => [Math.round(val), name]}
              />
              <ReferenceLine y={300} stroke="#EF4444" strokeDasharray="4 4" />
              <ReferenceLine y={200} stroke="#F97316" strokeDasharray="4 4" />
              <ReferenceLine y={100} stroke="#EAB308" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="upper95" stroke="transparent" fill="url(#ci95)" name={t('forecast.ci95Upper', '95% CI Upper')} />
              <Area type="monotone" dataKey="lower95" stroke="transparent" fill="#030712" name={t('forecast.ci95Lower', '95% CI Lower')} />
              <Area type="monotone" dataKey="upper80" stroke="transparent" fill="url(#ci80)" name={t('forecast.ci80Upper', '80% CI Upper')} />
              <Area type="monotone" dataKey="lower80" stroke="transparent" fill="#030712" name={t('forecast.ci80Lower', '80% CI Lower')} />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke={selectedModel?.color}
                strokeWidth={2.5}
                dot={{ fill: selectedModel?.color, r: 3 }}
                name={t('forecast.predictedAQI', 'Predicted AQI')}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Forecast Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>{t('forecast.details', 'Forecast Details')}</h3>
        </div>
        <div className="divide-y divide-border/50">
          {chartData.slice(0, 14).map((row: any, i: number) => {
            const { color, category } = getAQICategory(row.predicted);
            return (
              <div key={i} className="grid grid-cols-6 gap-2 px-4 py-2.5 text-xs hover:bg-accent/20 transition-colors">
                <div className="col-span-1 text-muted-foreground">{row.date}</div>
                <div className="col-span-1 font-mono-data font-bold" style={{ color }}>{row.predicted}</div>
                <div className="col-span-1">
                  <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>{category}</Badge>
                </div>
                <div className="col-span-1 text-muted-foreground">{row.lower80}–{row.upper80}</div>
                <div className="col-span-1 text-muted-foreground">{row.lower95}–{row.upper95}</div>
                <div className="col-span-1 text-muted-foreground capitalize">{row.model}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
