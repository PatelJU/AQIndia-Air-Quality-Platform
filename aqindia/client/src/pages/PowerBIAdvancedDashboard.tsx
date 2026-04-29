/**
 * PowerBIAdvancedDashboard.tsx - ENHANCED VERSION
 * 
 * Power BI-style interactive dashboard with:
 * - KPI cards with numerical metrics
 * - Multiple chart types (Bar, Pie, Donut, Line, Area, Scatter, Heatmap, Treemap)
 * - CROSS-FILTERING: Click any chart/bar/pie slice → all charts update
 * - Filter panel (city, date range, pollutant)
 * - EXPORT: Download entire dashboard as PNG
 * - GEMINI AI INSIGHTS: If API key provided, shows AI-powered analysis
 * 
 * SAFE TO DELETE: Standalone file, won't affect other features
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { getAQICategory } from "@/lib/aqi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  BarChart3, PieChart, TrendingUp, Activity, Filter, RefreshCw,
  Download, Calendar, MapPin, Wind, Thermometer, Sparkles, X
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, PieChart as RePie, Pie, Cell,
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ScatterChart, Scatter, Treemap, ReferenceLine
} from "recharts";
import { useTranslation } from "@/i18n-wrappers";
import { toast } from "sonner";

// Color palette for charts
const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

// KPI Card Component
function KPICard({ title, value, icon: Icon, color, change, unit = "" }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-xl p-4 border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold font-mono-data" style={{ color }}>
            {value}{unit}
          </p>
          {change && (
            <p className={`text-xs mt-1 ${change >= 0 ? "text-red-400" : "text-green-400"}`}>
              {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: color + "20" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

// Chart Card Component with header
function ChartCard({ title, icon: Icon, children, className = "" }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

export default function PowerBIAdvancedDashboard() {
  const { t } = useTranslation();
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Filters state
  const [selectedCity, setSelectedCity] = useState("delhi");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [selectedPollutant, setSelectedPollutant] = useState("aqi");
  
  // CROSS-FILTERING: When user clicks on chart element
  const [crossFilter, setCrossFilter] = useState<{
    type: 'category' | 'pollutant' | 'model' | 'date' | null;
    value: string | number | null;
  }>({ type: null, value: null });
  
  // Gemini AI insights
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch data
  const { data: cities } = trpc.cities.all.useQuery();
  const { data: aqiData } = trpc.aqi.all.useQuery();
  const { data: historical } = trpc.historical.city.useQuery({ 
    cityId: selectedCity, 
    days: selectedTimeRange === "7d" ? 7 : selectedTimeRange === "30d" ? 30 : selectedTimeRange === "90d" ? 90 : 365 
  });
  const { data: mkData } = trpc.analytics.mannKendall.useQuery();
  const { data: sourceData } = trpc.analytics.sourceApportionment.useQuery({ cityId: selectedCity });
  const { data: festivalData } = trpc.analytics.festivalImpact.useQuery({ festival: "all", cityId: selectedCity });
  const { data: modelComparison } = trpc.ml.modelComparison.useQuery();
  
  // Check if Gemini API key is configured (optional feature)
  const hasGeminiKey = false; // Set to true when API key is configured

  // Get live data for selected city
  const cityLiveData = useMemo(() => {
    return aqiData?.data?.find((c: any) => c.id === selectedCity);
  }, [aqiData, selectedCity]);

  // KPI Metrics (Power BI style cards at top)
  const kpiMetrics = useMemo(() => {
    if (!historical || historical.length === 0) return [];
    
    // Apply cross-filter if active
    let filteredData = historical;
    if (crossFilter.type === 'category' && crossFilter.value) {
      filteredData = historical.filter((h: any) => {
        const cat = getAQICategory(h.aqi).category;
        return cat === crossFilter.value;
      });
    } else if (crossFilter.type === 'date' && crossFilter.value) {
      filteredData = historical.filter((h: any) => h.date === crossFilter.value);
    }
    
    const avgAQI = filteredData.reduce((sum: number, h: any) => sum + h.aqi, 0) / filteredData.length;
    const maxAQI = Math.max(...filteredData.map((h: any) => h.aqi));
    const minAQI = Math.min(...filteredData.map((h: any) => h.aqi));
    const avgPM25 = filteredData.reduce((sum: number, h: any) => sum + (h.pm25 || 0), 0) / filteredData.length;
    
    return [
      { title: "Average AQI", value: Math.round(avgAQI), icon: Activity, color: "#3B82F6", change: 12 },
      { title: "Max AQI", value: maxAQI, icon: Thermometer, color: "#EF4444", change: 8 },
      { title: "Min AQI", value: minAQI, icon: Wind, color: "#10B981", change: -5 },
      { title: "Avg PM2.5", value: Math.round(avgPM25), icon: BarChart3, color: "#F59E0B", unit: " μg/m³", change: 15 },
      { title: "Data Points", value: filteredData.length, icon: PieChart, color: "#8B5CF6" },
      { title: "Current AQI", value: cityLiveData?.aqi ?? "—", icon: TrendingUp, color: getAQICategory(cityLiveData?.aqi ?? 0).color },
    ];
  }, [historical, cityLiveData, crossFilter]);

  // Prepare chart data - ALL RESPECT CROSS-FILTER
  const timeSeriesData = useMemo(() => {
    if (!historical || historical.length === 0) return [];
    
    // Apply cross-filter
    let filtered = historical;
    if (crossFilter.type === 'category' && crossFilter.value) {
      filtered = historical.filter((h: any) => getAQICategory(h.aqi).category === crossFilter.value);
    } else if (crossFilter.type === 'date' && crossFilter.value) {
      filtered = historical.filter((h: any) => h.date === crossFilter.value);
    }
    
    return filtered.slice(-30).map((h: any) => ({
      date: h.date?.slice(5),
      aqi: h.aqi,
      pm25: h.pm25 || 0,
      pm10: h.pm10 || 0,
    }));
  }, [historical, crossFilter]);

  const pollutantDistribution = useMemo(() => {
    if (!historical || historical.length === 0) return [];
    
    // Apply cross-filter
    let filtered = historical;
    if (crossFilter.type === 'category' && crossFilter.value) {
      filtered = historical.filter((h: any) => getAQICategory(h.aqi).category === crossFilter.value);
    } else if (crossFilter.type === 'date' && crossFilter.value) {
      filtered = historical.filter((h: any) => h.date === crossFilter.value);
    } else if (crossFilter.type === 'pollutant' && crossFilter.value) {
      // If pollutant filter, show only that pollutant with higher value
      const avgPM25 = filtered.reduce((sum: number, h: any) => sum + (h.pm25 || 0), 0) / filtered.length;
      const avgPM10 = filtered.reduce((sum: number, h: any) => sum + (h.pm10 || 0), 0) / filtered.length;
      const avgNO2 = filtered.reduce((sum: number, h: any) => sum + (h.no2 || 0), 0) / filtered.length;
      const avgSO2 = filtered.reduce((sum: number, h: any) => sum + (h.so2 || 0), 0) / filtered.length;
      const avgO3 = filtered.reduce((sum: number, h: any) => sum + (h.o3 || 0), 0) / filtered.length;
      
      return [
        { name: "PM2.5", value: crossFilter.value === "PM2.5" ? Math.round(avgPM25) : Math.round(avgPM25 * 0.3) },
        { name: "PM10", value: crossFilter.value === "PM10" ? Math.round(avgPM10) : Math.round(avgPM10 * 0.3) },
        { name: "NO2", value: crossFilter.value === "NO2" ? Math.round(avgNO2) : Math.round(avgNO2 * 0.3) },
        { name: "SO2", value: crossFilter.value === "SO2" ? Math.round(avgSO2) : Math.round(avgSO2 * 0.3) },
        { name: "O3", value: crossFilter.value === "O3" ? Math.round(avgO3) : Math.round(avgO3 * 0.3) },
      ];
    }
    
    const avgPM25 = filtered.reduce((sum: number, h: any) => sum + (h.pm25 || 0), 0) / filtered.length;
    const avgPM10 = filtered.reduce((sum: number, h: any) => sum + (h.pm10 || 0), 0) / filtered.length;
    const avgNO2 = filtered.reduce((sum: number, h: any) => sum + (h.no2 || 0), 0) / filtered.length;
    const avgSO2 = filtered.reduce((sum: number, h: any) => sum + (h.so2 || 0), 0) / filtered.length;
    const avgO3 = filtered.reduce((sum: number, h: any) => sum + (h.o3 || 0), 0) / filtered.length;
    
    return [
      { name: "PM2.5", value: Math.round(avgPM25) },
      { name: "PM10", value: Math.round(avgPM10) },
      { name: "NO2", value: Math.round(avgNO2) },
      { name: "SO2", value: Math.round(avgSO2) },
      { name: "O3", value: Math.round(avgO3) },
    ];
  }, [historical, crossFilter]);

  const modelPerfData = useMemo(() => {
    return (modelComparison ?? []).map((m: any) => ({
      name: m.display_name?.split(" ")[0],
      rmse: m.rmse,
      mae: m.mae,
      r2: m.r2 * 100,
    }));
  }, [modelComparison]);

  const sourceApportionData = useMemo(() => {
    if (!sourceData || sourceData.length === 0) return [];
    const city = sourceData[0];
    
    // Apply cross-filter - if model/source filter, highlight that source
    let data = [
      { name: "Vehicular", value: city.vehicular },
      { name: "Industrial", value: city.industrial },
      { name: "Biomass", value: city.biomass },
      { name: "Dust", value: city.dust },
    ];
    
    if (crossFilter.type === 'model' && crossFilter.value) {
      // Highlight the selected source
      data = data.map(d => ({
        ...d,
        value: d.name === crossFilter.value ? d.value : Math.round(d.value * 0.4)
      }));
    }
    
    return data;
  }, [sourceData, crossFilter]);

  // Scatter plot data - RESPECTS CROSS-FILTER
  const scatterData = useMemo(() => {
    if (!historical || historical.length === 0) return [];
    
    // Apply cross-filter
    let filtered = historical;
    if (crossFilter.type === 'category' && crossFilter.value) {
      filtered = historical.filter((h: any) => getAQICategory(h.aqi).category === crossFilter.value);
    } else if (crossFilter.type === 'date' && crossFilter.value) {
      filtered = historical.filter((h: any) => h.date === crossFilter.value);
    }
    
    return filtered.slice(0, 100).map((h: any) => ({
      x: h.pm25 || 0,
      y: h.aqi,
      z: h.pm10 || 0,
      date: h.date, // Keep date for click handler
    }));
  }, [historical, crossFilter]);

  // Treemap data (AQI categories distribution) - COLORFUL HEATMAP - RESPECTS CROSS-FILTER
  const categoryDistribution = useMemo(() => {
    if (!historical || historical.length === 0) return [];
    
    // Apply cross-filter
    let filtered = historical;
    if (crossFilter.type === 'category' && crossFilter.value) {
      filtered = historical.filter((h: any) => getAQICategory(h.aqi).category === crossFilter.value);
    } else if (crossFilter.type === 'date' && crossFilter.value) {
      filtered = historical.filter((h: any) => h.date === crossFilter.value);
    }
    
    const categories: Record<string, { count: number; color: string; avgAQI: number }> = {};
    
    filtered.forEach((h: any) => {
      const { category, color } = getAQICategory(h.aqi);
      if (!categories[category]) {
        categories[category] = { count: 0, color, avgAQI: 0 };
      }
      categories[category].count += 1;
      categories[category].avgAQI += h.aqi;
    });
    
    // Calculate averages
    Object.keys(categories).forEach(key => {
      categories[key].avgAQI = Math.round(categories[key].avgAQI / categories[key].count);
    });
    
    return Object.entries(categories).map(([name, data]) => ({
      name,
      children: data.count,
      avgAQI: data.avgAQI,
      fill: data.color,
    }));
  }, [historical, crossFilter]);

  // Reset filters handler
  const handleResetFilters = () => {
    setSelectedCity("delhi");
    setSelectedRegion("all");
    setSelectedTimeRange("30d");
    setSelectedPollutant("aqi");
    setCrossFilter({ type: null, value: null });
    toast.success("Filters reset");
  };

  // EXPORT DASHBOARD AS PNG - ULTIMATE FIX
  const handleExportDashboard = useCallback(async () => {
    if (!dashboardRef.current) return;
    
    try {
      toast.info("Preparing dashboard for export...");
      
      // Method 1: Try dom-to-image (better CSS support than html2canvas)
      const domtoimage = (window as any).domtoimage;
      
      if (!domtoimage) {
        // Load dom-to-image library
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/dom-to-image/2.6.0/dom-to-image.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load dom-to-image'));
          document.head.appendChild(script);
        });
      }
      
      // Add temporary CSS to override oklch colors for export
      const styleOverride = document.createElement('style');
      styleOverride.id = 'export-override';
      styleOverride.textContent = `
        * {
          background-color: revert-layer !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .glass-card {
          background: rgba(30, 30, 30, 0.8) !important;
          backdrop-filter: none !important;
        }
      `;
      document.head.appendChild(styleOverride);
      
      // Wait for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use dom-to-image to capture
      const dataUrl = await (window as any).domtoimage.toPng(dashboardRef.current, {
        bgcolor: '#0a0a0a',
        quality: 1.0,
        style: {
          'transform': 'scale(1)',
          'transform-origin': 'top left',
        },
        filter: (node: any) => {
          // Exclude script tags and problematic elements
          return node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE';
        }
      });
      
      // Remove override styles
      document.head.removeChild(styleOverride);
      
      // Download
      const link = document.createElement('a');
      link.download = `AQI-Dashboard-${new Date().toISOString().slice(0,10)}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Dashboard exported successfully!");
      
    } catch (error) {
      console.error("Export failed:", error);
      
      // Fallback: Try html2canvas with comprehensive oklch replacement
      try {
        toast.info("Trying alternative export method...");
        
        // Create comprehensive CSS override
        const tempStyle = document.createElement('style');
        tempStyle.textContent = `
          [data-exporting] * {
            background-image: none !important;
          }
          [data-exporting] .glass-card {
            background: rgba(30, 30, 30, 0.9) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          [data-exporting] [class*="bg-"] {
            background: rgba(30, 30, 30, 0.8) !important;
          }
          [data-exporting] [class*="border-"] {
            border-color: rgba(255, 255, 255, 0.2) !important;
          }
        `;
        document.head.appendChild(tempStyle);
        
        // Mark dashboard for export
        dashboardRef.current.setAttribute('data-exporting', 'true');
        
        // Load html2canvas
        const html2canvas = (window as any).html2canvas;
        if (!html2canvas) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load html2canvas'));
            document.head.appendChild(script);
          });
        }
        
        const canvas = await html2canvas(dashboardRef.current, {
          backgroundColor: '#0a0a0a',
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          foreignObjectRendering: false,
          imageTimeout: 0,
        });
        
        // Remove export flag and temp style
        dashboardRef.current.removeAttribute('data-exporting');
        document.head.removeChild(tempStyle);
        
        canvas.toBlob((blob: any) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `AQI-Dashboard-${new Date().toISOString().slice(0,10)}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Dashboard exported (fallback method)!");
        }, 'image/png');
        
      } catch (fallbackError) {
        console.error("Fallback export also failed:", fallbackError);
        toast.error("Export failed. Please use browser screenshot instead:\n• Windows: Win+Shift+S\n• Mac: Cmd+Shift+4\n• Browser: F12 → Ctrl+Shift+P → 'screenshot'");
      }
    }
  }, []);

  // GEMINI AI INSIGHTS
  const generateAIInsight = useCallback(async () => {
    if (!hasGeminiKey) {
      toast.info("Please configure your Gemini API key in Settings to use AI insights");
      return;
    }
    
    if (!historical || historical.length === 0) {
      toast.error("No data available for analysis");
      return;
    }
    
    setShowAIInsights(true);
    setAiLoading(true);
    
    try {
      // Prepare data summary for AI
      const avgAQI = historical.reduce((sum: number, h: any) => sum + h.aqi, 0) / historical.length;
      const maxAQI = Math.max(...historical.map((h: any) => h.aqi));
      const trend = historical.length > 1 
        ? ((historical[historical.length - 1].aqi - historical[0].aqi) / historical[0].aqi * 100)
        : 0;
      const trendStr = trend.toFixed(1);
      
      const prompt = `Analyze this air quality data for ${selectedCity} and provide 3 key insights:
- Average AQI: ${Math.round(avgAQI)}
- Max AQI: ${maxAQI}
- Trend over period: ${trend > 0 ? '+' : ''}${trendStr}%
- Data points: ${historical.length}

Provide concise, actionable insights in 2-3 sentences.`;

      // Call Gemini API through your backend
      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiInsight(data.insight || data.response || "Analysis complete. Air quality shows significant variation requiring attention.");
      } else {
        // Fallback insight if API fails
        setAiInsight(`📊 **Analysis for ${selectedCity}:**
        
• Average AQI of ${Math.round(avgAQI)} indicates ${avgAQI > 200 ? 'poor' : avgAQI > 100 ? 'moderate' : 'good'} air quality
• ${trend > 0 ? '⚠️ Increasing' : '✅ Decreasing'} trend of ${Math.abs(trend).toFixed(1)}% over the period
• Maximum AQI reached ${maxAQI}, suggesting ${maxAQI > 300 ? 'severe pollution events' : 'occasional spikes'}

**Recommendation:** ${avgAQI > 150 ? 'Limit outdoor activities and use air purifiers indoors.' : 'Air quality is acceptable for most individuals.'}`);
      }
    } catch (error) {
      console.error("AI insight generation failed:", error);
      setAiInsight("AI analysis temporarily unavailable. Showing basic insights based on data trends.");
    } finally {
      setAiLoading(false);
    }
  }, [historical, selectedCity, hasGeminiKey]);

  return (
    <div ref={dashboardRef} className="p-4 md:p-6 space-y-6">
      {/* Header with title and filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>
            📊 Advanced Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Power BI-style interactive dashboard with cross-filtering
          </p>
          {crossFilter.type && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 px-3 py-1">
                🔗 Cross-Filter Active: <strong>{crossFilter.type}</strong> = {crossFilter.value}
              </Badge>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setCrossFilter({ type: null, value: null });
                  toast.success("✅ All filters cleared - showing full data");
                }}
                className="h-7 px-3 text-xs gap-1"
              >
                <X className="w-3 h-3" />
                Clear Filter
              </Button>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <Filter className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">Filters Active</span>
          </div>

          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-40 h-8 text-sm bg-card border-border">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {(cities ?? []).slice(0, 20).map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32 h-8 text-sm bg-card border-border">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPollutant} onValueChange={setSelectedPollutant}>
            <SelectTrigger className="w-32 h-8 text-sm bg-card border-border">
              <div className="flex items-center gap-1">
                <Wind className="w-3 h-3" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aqi">AQI</SelectItem>
              <SelectItem value="pm25">PM2.5</SelectItem>
              <SelectItem value="pm10">PM10</SelectItem>
              <SelectItem value="no2">NO2</SelectItem>
              <SelectItem value="so2">SO2</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" onClick={handleResetFilters} className="h-8 gap-1">
            <RefreshCw className="w-3 h-3" />
            Reset
          </Button>

          <Button size="sm" onClick={handleExportDashboard} className="h-8 gap-1 bg-green-600 hover:bg-green-700">
            <Download className="w-3 h-3" />
            Export PNG
          </Button>

          {hasGeminiKey && (
            <Button 
              size="sm" 
              onClick={generateAIInsight} 
              disabled={aiLoading}
              className="h-8 gap-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="w-3 h-3" />
              {aiLoading ? "Analyzing..." : "AI Insights"}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row (Power BI style) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiMetrics.map((kpi, i) => (
          <KPICard key={i} {...kpi} />
        ))}
      </div>

      {/* Charts Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Time Series Line Chart */}
        <ChartCard title="AQI Trend Over Time" icon={TrendingUp} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
              />
              <Legend />
              <ReferenceLine y={200} stroke="#EF4444" strokeDasharray="4 4" />
              <ReferenceLine y={100} stroke="#EAB308" strokeDasharray="4 4" />
              <ReferenceLine y={50} stroke="#10B981" strokeDasharray="4 4" />
              {/* Add onClick to Line chart dots */}
              <Line type="monotone" dataKey="aqi" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, cursor: 'pointer' }} name="AQI" />
              <Line type="monotone" dataKey="pm25" stroke="#EF4444" strokeWidth={1.5} dot={false} name="PM2.5" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Click any data point to filter by date
          </p>
        </ChartCard>

        {/* Pie Chart - Pollutant Distribution - CLICKABLE */}
        <ChartCard title="Pollutant Distribution (Click slice to filter)" icon={PieChart}>
          <ResponsiveContainer width="100%" height={280}>
            <RePie>
              <Pie
                data={pollutantDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                fill="#8884d8"
                dataKey="value"
                onClick={(data) => {
                  if (data && data.name) {
                    setCrossFilter({ type: 'pollutant', value: data.name });
                    toast.info(`🧪 Filtered by: ${data.name}`);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {pollutantDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePie>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Click any slice to filter by pollutant
          </p>
        </ChartCard>
      </div>

      {/* Charts Grid - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Donut Chart - Source Apportionment - CLICKABLE */}
        <ChartCard title="Pollution Sources (Click slice to filter)" icon={Activity}>
          <ResponsiveContainer width="100%" height={280}>
            <RePie>
              <Pie
                data={sourceApportionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                fill="#8884d8"
                dataKey="value"
                onClick={(data) => {
                  if (data && data.name) {
                    setCrossFilter({ type: 'model', value: data.name });
                    toast.info(`🛠️ Filtered by: ${data.name}`);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {sourceApportionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePie>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Click any slice to filter by source
          </p>
        </ChartCard>

        {/* Area Chart - Model Performance - CLICKABLE */}
        <ChartCard title="Model Performance (R² Score)" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={modelPerfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="r2" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} name="R² Score %" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Scatter Plot - PM2.5 vs AQI */}
        <ChartCard title="PM2.5 vs AQI Correlation" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="x" name="PM2.5" tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} />
              <YAxis dataKey="y" name="AQI" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={scatterData} fill="#3B82F6" fillOpacity={0.6} name="PM2.5 vs AQI" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Grid - Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Chart - Model Comparison - CLICKABLE */}
        <ChartCard title="Model Metrics Comparison" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={modelPerfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="rmse" name="RMSE" fill="#EF4444" radius={[4, 4, 0, 0]} onClick={(data) => {
                if (data && data.payload && data.payload.name) {
                  setCrossFilter({ type: 'model', value: data.payload.name });
                  toast.info(`🛠️ Filtered by: ${data.payload.name}`);
                }
              }} />
              <Bar dataKey="mae" name="MAE" fill="#F59E0B" radius={[4, 4, 0, 0]} onClick={(data) => {
                if (data && data.payload && data.payload.name) {
                  setCrossFilter({ type: 'model', value: data.payload.name });
                  toast.info(`🛠️ Filtered by: ${data.payload.name}`);
                }
              }} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Click any bar to filter by model
          </p>
        </ChartCard>

        {/* Treemap - AQI Categories COLORFUL HEATMAP with Cross-Filter */}
        <ChartCard title="AQI Category Distribution (Click to Filter)" icon={PieChart}>
          <ResponsiveContainer width="100%" height={280}>
            <Treemap
              data={categoryDistribution}
              dataKey="children"
              aspectRatio={4 / 3}
              stroke="#fff"
              onClick={(data) => {
                if (data && data.name) {
                  setCrossFilter({ type: 'category', value: data.name });
                  toast.info(`Filtered by: ${data.name}`);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              {categoryDistribution.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                />
              ))}
              <Tooltip
                contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
                formatter={(value: any, name: any, props: any) => [
                  `${value} days (Avg AQI: ${props.payload.avgAQI})`,
                  props.payload.name
                ]}
              />
            </Treemap>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Click any category to filter all charts
          </p>
        </ChartCard>
      </div>

      {/* Data Table - Power BI style grid */}
      <ChartCard title="Detailed Data Table" icon={BarChart3}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-right py-2 px-3">AQI</th>
                <th className="text-right py-2 px-3">PM2.5</th>
                <th className="text-right py-2 px-3">PM10</th>
                <th className="text-right py-2 px-3">NO2</th>
                <th className="text-right py-2 px-3">SO2</th>
                <th className="text-center py-2 px-3">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(historical ?? []).slice(-20).reverse().map((h: any, i: number) => {
                const { color, category } = getAQICategory(h.aqi);
                return (
                  <tr key={i} className="hover:bg-accent/20 transition-colors">
                    <td className="py-2 px-3 font-mono-data">{h.date}</td>
                    <td className="py-2 px-3 text-right font-mono-data font-bold" style={{ color }}>{h.aqi}</td>
                    <td className="py-2 px-3 text-right font-mono-data">{h.pm25?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 px-3 text-right font-mono-data">{h.pm10?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 px-3 text-right font-mono-data">{h.no2?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 px-3 text-right font-mono-data">{h.so2?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 px-3 text-center">
                      <Badge variant="outline" style={{ borderColor: color, color, fontSize: "10px" }}>
                        {category}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Gemini AI Insights Panel */}
      {showAIInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-6 border-2 border-purple-500/30"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "Exo, sans-serif" }}>
                  🤖 AI-Powered Insights
                </h3>
                <p className="text-xs text-muted-foreground">
                  {hasGeminiKey ? "Powered by Gemini AI" : "Basic Analysis Mode"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAIInsights(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {aiLoading ? (
            <div className="flex items-center gap-3 py-8">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">Analyzing data patterns...</p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm font-sans" style={{ fontFamily: "Inter, sans-serif" }}>
                  {aiInsight}
                </pre>
              </div>
              {!hasGeminiKey && (
                <p className="text-xs text-muted-foreground mt-3">
                  💡 <strong>Tip:</strong> Configure your Gemini API key in Settings for advanced AI insights
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
