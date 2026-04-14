import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Map, BarChart3, TrendingUp, GitCompare,
  LineChart, Brain, FlaskConical, Heart, Key, FileText,
  Info, Menu, X, Wind, Bell, Settings, ChevronRight,
  Activity, Zap, Gauge, Sliders, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { getAQICategory } from "@/lib/aqi";
import { useAPIKeys } from "@/lib/apiKeys";
import { LanguageSwitcher, useTranslation } from "@/i18n-wrappers";
import CommandPalette from "@/components/CommandPalette";

const NAV_ITEMS = [
  { path: "/", label: "navigation.overview", defaultLabel: "Overview", icon: LayoutDashboard, group: "navigation.main" },
  { path: "/map", label: "navigation.indiaMap", defaultLabel: "India Map", icon: Map, group: "navigation.main" },
  { path: "/rankings", label: "navigation.cityRankings", defaultLabel: "City Rankings", icon: BarChart3, group: "navigation.main" },
  { path: "/forecast", label: "navigation.aqiForecast", defaultLabel: "AQI Forecast", icon: TrendingUp, group: "navigation.analysis" },
  { path: "/comparison", label: "navigation.cityComparison", defaultLabel: "City Comparison", icon: GitCompare, group: "navigation.analysis" },
  { path: "/analytics", label: "navigation.analytics", defaultLabel: "Analytics", icon: LineChart, group: "navigation.analysis" },
  { path: "/ml-predictions", label: "navigation.mlPredictions", defaultLabel: "ML Predictions", icon: Brain, group: "navigation.dataScience" },
  { path: "/data-science", label: "navigation.dsDashboard", defaultLabel: "DS Dashboard", icon: FlaskConical, group: "navigation.dataScience" },
  { path: "/model-performance", label: "navigation.mlopsMonitor", defaultLabel: "MLOps Monitor", icon: Gauge, group: "navigation.dataScience" },
  { path: "/what-if-simulator", label: "navigation.whatIfSimulator", defaultLabel: "What-If Simulator", icon: Sliders, group: "navigation.dataScience" },
  { path: "/ensemble-optimizer", label: "navigation.ensembleOptimizer", defaultLabel: "Ensemble Optimizer", icon: Layers, group: "navigation.dataScience" },
  { path: "/health", label: "navigation.healthAdvisory", defaultLabel: "Health Advisory", icon: Heart, group: "navigation.insights" },
  { path: "/reports", label: "navigation.reports", defaultLabel: "Reports", icon: FileText, group: "navigation.insights" },
  { path: "/settings", label: "navigation.apiSettings", defaultLabel: "API Settings", icon: Key, group: "navigation.config" },
  { path: "/about", label: "navigation.about", defaultLabel: "About", icon: Info, group: "navigation.config" },
];

const GROUPS = [
  { key: "navigation.main", defaultLabel: "Main" },
  { key: "navigation.analysis", defaultLabel: "Analysis" },
  { key: "navigation.dataScience", defaultLabel: "Data Science" },
  { key: "navigation.insights", defaultLabel: "Insights" },
  { key: "navigation.config", defaultLabel: "Config" }
];

export default function AQIDashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { hasGemini, hasWAQI } = useAPIKeys();
  const { t } = useTranslation();

  const { data: national } = trpc.aqi.national.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000,
  });

  const nationalAQI = national?.national_avg ?? 0;
  const { color, category } = getAQICategory(nationalAQI);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-shrink-0 flex flex-col border-r border-border bg-sidebar overflow-hidden"
            style={{ width: 240 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Wind className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground" style={{ fontFamily: "Exo, sans-serif" }}>
                  AQIndia
                </h1>
                <p className="text-xs text-muted-foreground">Air Quality Platform</p>
              </div>
            </div>

            {/* National AQI Status */}
            <div className="mx-3 mt-3 p-3 rounded-lg glass-card">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('aqi.national', 'National AQI')}</span>
                <div className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
                  </span>
                  <span className="text-xs text-muted-foreground">{t('aqi.live', 'Live')}</span>
                </div>
              </div>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-2xl font-bold font-mono-data" style={{ color, fontFamily: "Roboto Mono, monospace" }}>
                  {nationalAQI || "—"}
                </span>
                <span className="text-xs mb-1" style={{ color }}>{category}</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
              {GROUPS.map(group => {
                const items = NAV_ITEMS.filter(n => n.group === group.key);
                return (
                  <div key={group.key}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                      {t(group.key, group.defaultLabel)}
                    </p>
                    {items.map(item => {
                      const isActive = location === item.path ||
                        (item.path !== "/" && location.startsWith(item.path));
                      return (
                        <Link key={item.path} href={item.path}>
                          <motion.div
                            whileHover={{ x: 2 }}
                            className={cn(
                              "flex items-center gap-2 px-2 py-2 rounded-md text-sm cursor-pointer transition-colors",
                              isActive
                                ? "bg-blue-600/15 text-blue-400 border-l-2 border-blue-500"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            <span style={{ fontFamily: "Exo, sans-serif" }}>{t(item.label, item.defaultLabel)}</span>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            {/* API Status Footer */}
            <div className="p-3 border-t border-border space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className={cn("w-2 h-2 rounded-full", hasWAQI ? "bg-green-500" : "bg-gray-600")} />
                <span className="text-muted-foreground">WAQI: {hasWAQI ? "Connected" : "No key"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={cn("w-2 h-2 rounded-full", hasGemini ? "bg-purple-500" : "bg-gray-600")} />
                <span className="text-muted-foreground">Gemini AI: {hasGemini ? "Validating" : "Off"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Open-Meteo: Active</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Wind className="w-3.5 h-3.5 text-blue-400" />
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground" style={{ fontFamily: "Exo, sans-serif" }}>
              {NAV_ITEMS.find(n => n.path === location || (n.path !== "/" && location.startsWith(n.path)))?.label ?? "AQIndia"}
            </span>
          </div>

          <div className="flex-1" />

          {/* Status indicators */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Command Palette Search */}
            <CommandPalette />

            {national && (
              <div className="hidden md:flex items-center gap-2 text-xs">
                <Activity className="w-3.5 h-3.5 text-green-400" />
                <span className="text-muted-foreground">{national.total_cities} {t('aqi.cities', 'cities')}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{national.cities_above_200} {t('aqi.severe', 'severe')}</span>
              </div>
            )}
            {hasGemini && (
              <div className="flex items-center gap-1 text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20">
                <Zap className="w-3 h-3" />
                <span>AI Validated</span>
              </div>
            )}
            <Link href="/settings">
              <button className="p-1.5 rounded-md hover:bg-accent transition-colors" aria-label="Settings">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
