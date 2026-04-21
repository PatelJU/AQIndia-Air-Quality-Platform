import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getAQICategory, REGIONS } from "@/lib/aqi";
import { useCrossFilter } from "@/contexts/CrossFilterContext";
import { useTranslation } from "@/i18n-wrappers";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, RefreshCw, Grid3X3, List, TrendingUp, TrendingDown,
  Minus, Wind, Thermometer, Droplets, MapPin, Star, AlertTriangle,
  ArrowUpRight, BarChart2, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";

function AQIGauge({ aqi, size = 80 }: { aqi: number; size?: number }) {
  const { color, category } = getAQICategory(aqi);
  const pct = Math.min(aqi / 500, 1);
  const angle = pct * 180 - 90;
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`} aria-label={`AQI gauge: ${aqi} (${category})`}>
      {/* Track */}
      <path
        d={`M ${8} ${cy} A ${r} ${r} 0 0 1 ${size - 8} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${8} ${cy} A ${r} ${r} 0 0 1 ${size - 8} ${cy}`}
        fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${pct * Math.PI * r} ${Math.PI * r}`}
        opacity={0.9}
      />
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={cx + (r - 4) * Math.cos((angle - 90) * Math.PI / 180)}
        y2={cy + (r - 4) * Math.sin((angle - 90) * Math.PI / 180)}
        stroke={color} strokeWidth="2" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="3" fill={color} />
    </svg>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return <div className="w-16 h-8 skeleton" />;
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <AreaChart width={64} height={32} data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
      <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={1.5} dot={false} />
    </AreaChart>
  );
}

function CityCard({ city, viewMode }: { city: any; viewMode: "grid" | "list" }) {
  const { color, category, bgClass } = getAQICategory(city.aqi);
  const trend = city.aqi > 150 ? "up" : city.aqi < 80 ? "down" : "stable";
  const { t } = useTranslation();
  
  // Determine data source badge
  const fetchSource = city.fetch_source || "cached";
  const dataSourceLabel = city.data_source_label || city.data_source || t('home.cached', 'Cached');
  const sourceBadgeStyle = {
    borderColor: fetchSource === 'waqi_live' ? '#3B82F6' :
                 fetchSource === 'openaq_live' ? '#10B981' :
                 fetchSource === 'openmeteo_live' ? '#F59E0B' : '#6B7280',
    color: fetchSource === 'waqi_live' ? '#3B82F6' :
           fetchSource === 'openaq_live' ? '#10B981' :
           fetchSource === 'openmeteo_live' ? '#F59E0B' : '#6B7280'
  };
  const sourceIcon = fetchSource === 'waqi_live' ? '🌐' :
                     fetchSource === 'openaq_live' ? '🇮🇳' :
                     fetchSource === 'openmeteo_live' ? '🌤️' : '💾';

  if (viewMode === "list") {
    return (
      <Link href={`/city/${city.id}`}>
        <motion.div
          whileHover={{ x: 2 }}
          className={cn("flex items-center gap-4 px-4 py-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50", bgClass)}
          role="article"
          aria-label={`${city.name}: AQI ${city.aqi} (${category})`}
        >
          <div className="w-12 text-center">
            <span className="text-lg font-bold font-mono-data" style={{ color }}>{city.aqi}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate" style={{ fontFamily: "Exo, sans-serif" }}>{city.name}</p>
            <p className="text-xs text-muted-foreground">{city.state} · {city.region}</p>
          </div>
          <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>{category}</Badge>
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
            <span>{city.pm25?.toFixed(0)} {t('chart.pm25', 'µg PM2.5')}</span>
            <span>{city.temperature?.toFixed(0)}{t('chart.temperature', '°C')}</span>
          </div>
          <Badge variant="outline" className="text-xs" style={sourceBadgeStyle}>
            {sourceIcon} {dataSourceLabel}
          </Badge>
          {trend === "up" ? <TrendingUp className="w-4 h-4 text-red-400" /> :
           trend === "down" ? <TrendingDown className="w-4 h-4 text-green-400" /> :
           <Minus className="w-4 h-4 text-muted-foreground" />}
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/city/${city.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn("glass-card rounded-xl p-4 cursor-pointer border", bgClass)}
        role="article"
        aria-label={`${city.name}: AQI ${city.aqi} (${category})`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-sm text-foreground" style={{ fontFamily: "Exo, sans-serif" }}>{city.name}</p>
            <p className="text-xs text-muted-foreground">{city.state}</p>
          </div>
          <div className="flex items-center gap-1">
            {trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-red-400" /> :
             trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-green-400" /> :
             <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold font-mono-data" style={{ color, fontFamily: "Roboto Mono, monospace" }}>
              {city.aqi}
            </span>
            <p className="text-xs mt-0.5" style={{ color }}>{category}</p>
          </div>
          <Sparkline data={[city.aqi * 0.8, city.aqi * 0.9, city.aqi * 0.95, city.aqi, city.aqi * 1.02]} color={color} />
        </div>

        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wind className="w-3 h-3" />
            <span>{city.wind_speed?.toFixed(1)} {t('chart.windSpeed', 'm/s')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Thermometer className="w-3 h-3" />
            <span>{city.temperature?.toFixed(0)}{t('chart.temperature', '°C')}</span>
          </div>
          <Badge variant="outline" className="ml-auto text-xs" style={sourceBadgeStyle}>
            {sourceIcon} {dataSourceLabel}
          </Badge>
        </div>
      </motion.div>
    </Link>
  );
}

export default function Home() {
  const { filters, setRegion, setAQICategory, setSortBy, setSearchQuery } = useCrossFilter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { t } = useTranslation();

  const { data: aqiData, isLoading, refetch, isFetching } = trpc.aqi.all.useQuery();
  const { data: national } = trpc.aqi.national.useQuery();

  const cities = useMemo(() => {
    if (!aqiData?.data) return [];
    let data = [...aqiData.data];
    if (filters.region) data = data.filter(c => c.region === filters.region);
    if (filters.aqiCategory) data = data.filter(c => getAQICategory(c.aqi).category === filters.aqiCategory);
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      data = data.filter(c => c.name.toLowerCase().includes(q) || c.state?.toLowerCase().includes(q));
    }
    if (filters.sortBy === "aqi_asc") data.sort((a, b) => a.aqi - b.aqi);
    else if (filters.sortBy === "aqi_desc") data.sort((a, b) => b.aqi - a.aqi);
    else if (filters.sortBy === "name") data.sort((a, b) => a.name.localeCompare(b.name));
    return data;
  }, [aqiData, filters]);

  const distData = national?.distribution
    ? Object.entries(national.distribution).map(([name, value]) => ({
        name, value,
        color: { Good: "#22C55E", Moderate: "#EAB308", Poor: "#F97316", "Very Poor": "#EF4444", Severe: "#8B0000" }[name] ?? "#6B7280"
      }))
    : [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Exo, sans-serif" }}>
              {t('home.title', 'Air Quality Overview')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('home.subtitle', 'Real-time AQI monitoring across {count} Indian cities').replace('{count}', String(aqiData?.source_info?.total_cities ?? "—"))}
            </p>
            {/* Data Source Badge */}
            {aqiData?.source_info && (
              <div className="mt-2">
                <Badge 
                  variant="outline" 
                  className="text-xs font-medium" 
                  style={{
                    borderColor: aqiData.source_info.primary.includes("WAQI") ? "#3B82F6" : "#6B7280",
                    color: aqiData.source_info.primary.includes("WAQI") ? "#3B82F6" : "#6B7280"
                  }}
                >
                  {aqiData.source_info.primary.includes("WAQI") ? "🌐" : "💾"} {aqiData.source_info.primary}
                  {aqiData.source_info.cities_fetched_live !== undefined && 
                    ` (${aqiData.source_info.cities_fetched_live}/${aqiData.source_info.total_cities} live)`
                  }
                </Badge>
              </div>
            )}
          </div>
          <FloatingGuide content={helpContent.home} />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
          {t('home.refresh', 'Refresh')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: t('home.nationalAvgAQI', 'National Avg AQI'),
            value: national?.national_avg ?? "—",
            sub: national ? getAQICategory(national.national_avg).category : "",
            color: national ? getAQICategory(national.national_avg).color : "#6B7280",
            icon: Activity,
          },
          {
            label: t('home.bestCity', 'Best City'),
            value: national?.best_city?.name ?? "—",
            sub: `AQI ${national?.best_city?.aqi ?? "—"}`,
            color: "#22C55E",
            icon: TrendingDown,
          },
          {
            label: t('home.worstCity', 'Worst City'),
            value: national?.worst_city?.name ?? "—",
            sub: `AQI ${national?.worst_city?.aqi ?? "—"}`,
            color: "#EF4444",
            icon: TrendingUp,
          },
          {
            label: t('home.severeCities', 'Severe Cities'),
            value: national?.cities_above_200 ?? "—",
            sub: t('home.aqiAbove200', 'AQI > 200'),
            color: "#F97316",
            icon: AlertTriangle,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            </div>
            <p className="text-xl font-bold mt-1 font-mono-data truncate" style={{ color: kpi.color, fontFamily: "Roboto Mono, monospace" }}>
              {kpi.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Distribution + Source Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>{t('home.aqiDistribution', 'AQI Distribution')}</h3>
          <div className="flex items-center gap-4">
            <PieChart width={100} height={100}>
              <Pie data={distData} cx={50} cy={50} innerRadius={28} outerRadius={45} dataKey="value" strokeWidth={0}>
                {distData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
            <div className="space-y-1 flex-1">
              {distData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-mono-data font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 md:col-span-2">
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>{t('home.dataSources', 'Data Sources')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Open-Meteo", status: t('home.openMeteoStatus', 'Active'), color: "#10B981", desc: t('home.openMeteoDesc', 'Free air quality API') },
              { name: "WAQI", status: aqiData?.source_info?.waqi_available ? t('home.waqiStatusConnected', 'Connected') : t('home.waqiStatusAddKey', 'Add Key'), color: aqiData?.source_info?.waqi_available ? "#3B82F6" : "#6B7280", desc: t('home.waqiDesc', 'World Air Quality Index') },
              { name: "Gemini AI", status: aqiData?.source_info?.gemini_available ? t('home.geminiStatusValidating', 'Validating') : t('home.geminiStatusAddKey', 'Add Key'), color: aqiData?.source_info?.gemini_available ? "#8B5CF6" : "#6B7280", desc: t('home.geminiDesc', 'Data validation layer') },
              { name: "CPCB", status: t('home.cpcbStatus', 'Historical'), color: "#F59E0B", desc: t('home.cpcbDesc', 'India government data') },
            ].map(src => (
              <div key={src.name} className="flex items-center gap-2 p-2 rounded-lg bg-accent/30">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: src.color }} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{src.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{src.status}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('home.addKeysForLive', 'Add WAQI/Gemini keys in API Settings for live data & AI validation')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder={t('home.searchCities', 'Search cities...')}
            value={filters.searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm bg-card border-border"
            aria-label={t('home.searchCities', 'Search cities...')}
          />
        </div>

        <Select value={filters.region ?? "all"} onValueChange={v => setRegion(v === "all" ? null : v)}>
          <SelectTrigger className="w-36 h-8 text-sm bg-card border-border">
            <SelectValue placeholder={t('navigation.main', 'Main')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('home.allRegions', 'All Regions')}</SelectItem>
            {REGIONS.map(r => <SelectItem key={r} value={r}>{t(`region.${r}`, r)}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.aqiCategory ?? "all"} onValueChange={v => setAQICategory(v === "all" ? null : v)}>
          <SelectTrigger className="w-36 h-8 text-sm bg-card border-border">
            <SelectValue placeholder={t('aqi.category', 'Category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('home.allCategories', 'All Categories')}</SelectItem>
            {["Good", "Moderate", "Poor", "Very Poor", "Severe"].map(c => <SelectItem key={c} value={c}>{t(`aqi.${c.toLowerCase() === 'very poor' ? 'veryPoor' : c.toLowerCase()}`, c)}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-36 h-8 text-sm bg-card border-border">
            <SelectValue placeholder={t('common.filter', 'Filter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aqi_desc">{t('home.worstFirst', 'Worst First')}</SelectItem>
            <SelectItem value="aqi_asc">{t('home.bestFirst', 'Best First')}</SelectItem>
            <SelectItem value="name">{t('home.nameAZ', 'Name A-Z')}</SelectItem>
            <SelectItem value="region">{t('home.byRegion', 'By Region')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("p-1.5 rounded", viewMode === "grid" ? "bg-blue-600/20 text-blue-400" : "text-muted-foreground hover:text-foreground")}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("p-1.5 rounded", viewMode === "list" ? "bg-blue-600/20 text-blue-400" : "text-muted-foreground hover:text-foreground")}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cities Grid/List */}
      {isLoading ? (
        <div className={cn(
          viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" : "space-y-2"
        )}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={cn("skeleton rounded-xl", viewMode === "grid" ? "h-32" : "h-14")} />
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{cities.length} {t('home.citiesShown', 'cities shown')}</p>
          <motion.div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                : "space-y-2"
            )}
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
          >
            {cities.map(city => (
              <motion.div
                key={city.id}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              >
                <CityCard city={city} viewMode={viewMode} />
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
