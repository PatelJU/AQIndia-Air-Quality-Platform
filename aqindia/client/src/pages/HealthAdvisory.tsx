import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { getAQICategory } from "@/lib/aqi";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Heart, Shield, AlertTriangle, Activity, Wind, Eye, Users, Baby, Stethoscope } from "lucide-react";
import { useTranslation } from "@/i18n-wrappers";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";

const HEALTH_GUIDELINES: Record<string, {
  general: string; sensitive: string; children: string; outdoor: string; indoor: string; mask: string;
}> = {
  Good: {
    general: "Air quality is satisfactory. Enjoy outdoor activities.",
    sensitive: "Unusually sensitive individuals should consider reducing prolonged outdoor exertion.",
    children: "Safe for outdoor play and sports activities.",
    outdoor: "All outdoor activities are safe.",
    indoor: "No special precautions needed.",
    mask: "No mask required.",
  },
  Moderate: {
    general: "Air quality is acceptable. Some pollutants may be of concern for sensitive individuals.",
    sensitive: "Active children and adults, and people with respiratory disease should limit prolonged outdoor exertion.",
    children: "Limit prolonged outdoor activities for children with asthma.",
    outdoor: "Unusually sensitive people should consider reducing prolonged outdoor exertion.",
    indoor: "Keep windows closed during peak pollution hours.",
    mask: "Optional for sensitive groups.",
  },
  Poor: {
    general: "Members of sensitive groups may experience health effects. General public less likely to be affected.",
    sensitive: "Avoid prolonged or heavy outdoor exertion. Move activities indoors or reschedule.",
    children: "Avoid outdoor activities. Keep children indoors.",
    outdoor: "Reduce prolonged or heavy outdoor exertion. Take more breaks during outdoor activities.",
    indoor: "Use air purifiers. Keep windows closed.",
    mask: "N95 mask recommended for sensitive groups.",
  },
  "Very Poor": {
    general: "Health alert: Everyone may experience more serious health effects.",
    sensitive: "Avoid all outdoor physical activity.",
    children: "Do not allow children outdoors. Cancel outdoor sports/events.",
    outdoor: "Avoid all outdoor activities. Stay indoors.",
    indoor: "Run air purifiers on high. Seal gaps around doors and windows.",
    mask: "N95 mask required for all outdoor activities.",
  },
  Severe: {
    general: "Health warning of emergency conditions. Entire population is likely to be affected.",
    sensitive: "Remain indoors. Seek medical attention if experiencing symptoms.",
    children: "Emergency conditions. Keep children strictly indoors.",
    outdoor: "Avoid all outdoor exposure. Emergency protocols in effect.",
    indoor: "Maximum air filtration. Seek shelter in clean air environments.",
    mask: "N95/N99 mask mandatory. Limit all outdoor exposure.",
  },
};

const POLLUTANT_HEALTH: Record<string, { effects: string[]; sources: string[]; color: string }> = {
  "PM2.5": {
    effects: ["Deep lung penetration", "Cardiovascular disease", "Respiratory inflammation", "Premature mortality"],
    sources: ["Vehicle exhaust", "Industrial emissions", "Biomass burning", "Secondary formation"],
    color: "#EF4444",
  },
  "PM10": {
    effects: ["Respiratory irritation", "Aggravated asthma", "Reduced lung function", "Eye irritation"],
    sources: ["Road dust", "Construction", "Industrial processes", "Wind erosion"],
    color: "#F97316",
  },
  "NO₂": {
    effects: ["Airway inflammation", "Increased asthma risk", "Reduced lung development", "Respiratory infections"],
    sources: ["Vehicle exhaust", "Power plants", "Industrial boilers", "Gas appliances"],
    color: "#EAB308",
  },
  "SO₂": {
    effects: ["Bronchoconstriction", "Asthma attacks", "Mucus secretion", "Eye and throat irritation"],
    sources: ["Coal combustion", "Oil refining", "Volcanic activity", "Industrial smelting"],
    color: "#8B5CF6",
  },
  "O₃": {
    effects: ["Chest pain", "Coughing", "Throat irritation", "Reduced lung function"],
    sources: ["Photochemical reactions", "Vehicle exhaust + sunlight", "Industrial emissions"],
    color: "#3B82F6",
  },
  "CO": {
    effects: ["Reduced oxygen delivery", "Headaches", "Dizziness", "Cardiovascular stress"],
    sources: ["Incomplete combustion", "Vehicle exhaust", "Gas appliances", "Industrial processes"],
    color: "#10B981",
  },
};

export default function HealthAdvisory() {
  const [aqiValue, setAqiValue] = useState([150]);
  const { color, category, bgClass } = getAQICategory(aqiValue[0]);
  const guidelines = HEALTH_GUIDELINES[category] ?? HEALTH_GUIDELINES["Moderate"];
  const { t } = useTranslation();

  const { data: festivalData, error: festivalError } = trpc.analytics.festivalImpact.useQuery({ festival: "all" });
  const { data: aqiData, error: aqiError } = trpc.aqi.all.useQuery(); // Live WAQI data for all cities

  // Error handling with contextual logging
  if (festivalError) {
    console.error("[HealthAdvisory] Failed to fetch festival data:", {
      error: festivalError.message,
      timestamp: new Date().toISOString()
    });
  }

  if (aqiError) {
    console.error("[HealthAdvisory] Failed to fetch live AQI data:", {
      error: aqiError.message,
      timestamp: new Date().toISOString()
    });
  }

  const upcomingFestivals = (festivalData ?? [])
    .filter((f: any) => {
      const days = Math.round((new Date(f.date).getTime() - Date.now()) / 86400000);
      return days >= -7 && days <= 30;
    })
    .slice(0, 3);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>{t('health.title', 'Health Advisory')}</h1>
            <p className="text-sm text-muted-foreground">{t('health.subtitle', 'AQI-based health guidance and protective recommendations')}</p>
            {aqiData && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  🌐 Live data from {aqiData.source_info?.primary || 'WAQI'} • {(aqiData.data as any[]).length} cities monitored
                </span>
              </div>
            )}
          </div>
          <FloatingGuide content={helpContent.health} />
        </div>
      </div>

      {/* AQI Slider */}
      <div className={cn("glass-card rounded-2xl p-6 border", bgClass)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('health.aqiLevel', 'AQI Level')}</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold font-mono-data" style={{ color, fontFamily: "Roboto Mono, monospace" }}>
                {aqiValue[0]}
              </span>
              <span className="text-xl font-semibold mb-1" style={{ color }}>{category}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Adjust to see advisory</p>
          </div>
        </div>
        <Slider
          value={aqiValue}
          onValueChange={setAqiValue}
          min={0}
          max={500}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0 Good</span>
          <span>100 Moderate</span>
          <span>200 Poor</span>
          <span>300 Very Poor</span>
          <span>400+ Severe</span>
        </div>
      </div>

      {/* AQI Scale */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>India AQI Scale</h3>
        <div className="flex gap-1">
          {[
            { range: "0–50", label: "Good", color: "#22C55E" },
            { range: "51–100", label: "Satisfactory", color: "#84CC16" },
            { range: "101–200", label: "Moderate", color: "#EAB308" },
            { range: "201–300", label: "Poor", color: "#F97316" },
            { range: "301–400", label: "Very Poor", color: "#EF4444" },
            { range: "401+", label: "Severe", color: "#8B0000" },
          ].map(s => (
            <div
              key={s.label}
              className={cn(
                "flex-1 p-2 rounded text-center transition-all",
                aqiValue[0] >= parseInt(s.range) && "ring-2 ring-white/20"
              )}
              style={{ backgroundColor: s.color + "20", borderBottom: `3px solid ${s.color}` }}
            >
              <p className="text-xs font-bold" style={{ color: s.color }}>{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Health Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: Users, label: "General Public", text: guidelines.general, color: "#3B82F6" },
          { icon: Stethoscope, label: "Sensitive Groups", text: guidelines.sensitive, color: "#EF4444" },
          { icon: Baby, label: "Children", text: guidelines.children, color: "#F59E0B" },
          { icon: Activity, label: "Outdoor Activities", text: guidelines.outdoor, color: "#10B981" },
          { icon: Wind, label: "Indoor Air", text: guidelines.indoor, color: "#8B5CF6" },
          { icon: Shield, label: "Mask Advisory", text: guidelines.mask, color: "#6B7280" },
        ].map(item => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
              <span className="text-sm font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>{item.label}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Festival Warnings */}
      {upcomingFestivals.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>Festival Impact Warnings</h3>
          </div>
          <div className="space-y-2">
            {upcomingFestivals.map((f: any, i: number) => {
              const days = Math.round((new Date(f.date).getTime() - Date.now()) / 86400000);
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div>
                    <p className="text-sm font-medium capitalize">{f.festival}</p>
                    <p className="text-xs text-muted-foreground">
                      {days === 0 ? "Today" : days > 0 ? `In ${days} days` : `${Math.abs(days)} days ago`}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm font-mono-data text-orange-400">+{f.aqi_increase ?? 80}% AQI</p>
                    <p className="text-xs text-muted-foreground">Expected spike</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pollutant Health Effects */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>Pollutant Health Effects</h3>
        <Tabs defaultValue="PM2.5">
          <TabsList className="bg-card flex-wrap h-auto gap-1">
            {Object.keys(POLLUTANT_HEALTH).map(p => (
              <TabsTrigger key={p} value={p} className="text-xs">{p}</TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(POLLUTANT_HEALTH).map(([pollutant, info]) => (
            <TabsContent key={pollutant} value={pollutant}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Health Effects</h4>
                  <ul className="space-y-1">
                    {info.effects.map(e => (
                      <li key={e} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }} />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Primary Sources</h4>
                  <ul className="space-y-1">
                    {info.sources.map(s => (
                      <li key={s} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
