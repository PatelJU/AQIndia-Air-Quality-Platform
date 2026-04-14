import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { getAQICategory } from "@/lib/aqi";
import { generateProfessionalPDF } from "@/lib/pdfGenerator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { FileDown, FileText, Download, Printer, BarChart2, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/i18n-wrappers";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";

function downloadCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? "")).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Capture a DOM element as a base64 image for PDF embedding
 */
async function captureChartAsBase64(elementId: string): Promise<string | undefined> {
  try {
    const element = document.getElementById(elementId);
    if (!element) return undefined;

    const html2canvasModule = await import("html2canvas-pro");
    const html2canvas = html2canvasModule.default;

    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff", // White background for PDF
      scale: 2, // High quality
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("[Chart Capture] Failed to capture", elementId, err);
    return undefined;
  }
}

/**
 * Export professional PDF with embedded charts and live data
 */
async function exportProfessionalPDF(
  elementId: string,
  filename: string,
  reportData: any
) {
  try {
    console.log("[PDF Export] Starting professional PDF generation...", { filename });
    
    toast.info("Generating professional PDF report... Please wait");

    // Capture chart images
    const trendChartImage = await captureChartAsBase64("trend-chart-container");
    const pollutantChartImage = await captureChartAsBase64("pollutant-chart-container");
    const forecastChartImage = await captureChartAsBase64("forecast-chart-container");

    console.log("[PDF Export] Chart images captured:", {
      trend: !!trendChartImage,
      pollutant: !!pollutantChartImage,
      forecast: !!forecastChartImage,
    });

    // Build report data structure for PDF generator
    const pdfReportData = {
      cityName: reportData.city?.name || reportData.cityName || "Unknown",
      state: reportData.city?.state || reportData.state || "",
      region: reportData.city?.region || reportData.region || "",
      currentAQI: reportData.currentAQI || reportData.aqi || 0,
      pollutants: {
        pm25: reportData.pm25,
        pm10: reportData.pm10,
        no2: reportData.no2,
        so2: reportData.so2,
        o3: reportData.o3,
        co: reportData.co,
      },
      historicalData: reportData.historical || [],
      forecastData: reportData.forecast || [],
      mannKendall: reportData.mannKendall,
      dataSource: reportData.data_source || reportData.dataSource || "Live API",
      generatedAt: new Date(),
      chartImages: {
        trendChart: trendChartImage,
        pollutantChart: pollutantChartImage,
        forecastChart: forecastChartImage,
      },
    };

    // Generate and download PDF
    await generateProfessionalPDF(pdfReportData);
    
    console.log("[PDF Export] PDF generated successfully:", filename);
    toast.success("Professional PDF report exported successfully!");
    
  } catch (err) {
    console.error("[PDF Export] Failed:", err);
    toast.error("PDF export failed. Check console for details.");
    
    // Fallback to old method
    console.log("[PDF Export] Falling back to screenshot method...");
    await exportScreenshotPDF(elementId, filename);
  }
}

/**
 * Fallback: Export PDF using screenshot method (old approach)
 */
async function exportScreenshotPDF(elementId: string, filename: string) {
  try {
    const html2canvasModule = await import("html2canvas-pro");
    const jsPDFModule = await import("jspdf");
    const html2canvas = html2canvasModule.default;
    const jsPDF = jsPDFModule.default;
    
    const element = document.getElementById(elementId);
    if (!element) { 
      console.error("[PDF Export] Element not found:", elementId);
      toast.error("Report element not found"); 
      return; 
    }
    
    const canvas = await html2canvas(element, {
      backgroundColor: "#030712",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
    });
    
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ 
      orientation: "portrait", 
      unit: "mm", 
      format: "a4" 
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(filename);
    toast.success("PDF exported (screenshot mode)");
    
  } catch (err) {
    console.error("[PDF Export] Screenshot fallback failed:", err);
    toast.error("PDF export failed completely");
  }
}

export default function Reports() {
  const [cityId, setCityId] = useState("delhi");
  const [reportType, setReportType] = useState("city");
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const { data: cities } = trpc.cities.all.useQuery();
  const { data: cityData, isLoading: cityLoading, error: cityError } = trpc.aqi.city.useQuery({ cityId });
  // Request 365 days to get REAL Kaggle data (2015-2024) for 5 major cities
  const { data: historical, isLoading: histLoading, error: histError } = trpc.historical.city.useQuery({ cityId, days: 365 });
  const { data: forecastData, isLoading: forecastLoading } = trpc.forecast.city.useQuery({ cityId, horizon: "7d" });
  const { data: mkData } = trpc.analytics.mannKendall.useQuery();
  const { data: rankings, isLoading: rankingsLoading } = trpc.aqi.rankings.useQuery({});

  // Error handling with contextual logging
  if (cityError) {
    console.error("[Reports] Failed to fetch city data:", {
      error: cityError.message,
      cityId,
      timestamp: new Date().toISOString()
    });
  }

  if (histError) {
    console.error("[Reports] Failed to fetch historical data:", {
      error: histError.message,
      cityId,
      days: 365,  // Now requesting 365 days for REAL data
      timestamp: new Date().toISOString()
    });
  }

  const cityMK = mkData?.find((m: any) => m.city_id === cityId);
  const { color, category } = getAQICategory(cityData?.aqi ?? 0);

  const handleExportPDF = async () => {
    if (!cityData) {
      toast.error("No city data available. Please wait for data to load.");
      return;
    }

    setExporting(true);
    try {
      // Gather all report data
      const reportData = {
        ...cityData,
        historical: historical || [],
        forecast: forecastData || [],
        mannKendall: cityMK,
        city: cities?.find((c: any) => c.id === cityId),
      };

      await exportProfessionalPDF(
        "report-content",
        `AQIndia_Report_${cityId}_${new Date().toISOString().slice(0, 10)}.pdf`,
        reportData
      );
    } catch (err) {
      console.error("[Reports] PDF export error:", err);
      toast.error("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    if (!historical?.length) { toast.error("No data to export"); return; }
    downloadCSV(historical, `AQIndia_${cityId}_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("CSV exported");
  };

  const handleExportAllCSV = () => {
    if (!rankings?.length) { toast.error("No data to export"); return; }
    downloadCSV(rankings, `AQIndia_AllCities_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("All cities CSV exported");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>{t('reports.title', 'Reports & Export')}</h1>
            <p className="text-sm text-muted-foreground">{t('reports.subtitle', 'Generate PDF reports and export data as CSV')}</p>
            {cityData && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  📄 Report for {cityData.name} • AQI {cityData.aqi}
                </span>
              </div>
            )}
          </div>
          <FloatingGuide content={helpContent.reports} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="w-3.5 h-3.5" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAllCSV} className="gap-2">
            <Download className="w-3.5 h-3.5" />
            All Cities CSV
          </Button>
          <Button size="sm" onClick={handleExportPDF} disabled={exporting} className="gap-2">
            {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {(cityLoading || histLoading) && (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading report data...</p>
        </div>
      )}

      {/* Error State */}
      {(cityError || histError) && (
        <div className="glass-card rounded-xl p-8 text-center border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">Failed to load report data. Please try again.</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <Select value={cityId} onValueChange={setCityId}>
          <SelectTrigger className="w-44 h-8 text-sm bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* Show ALL cities (108 cities) */}
            {(cities ?? []).map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {["city", "summary", "ml"].map(t => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={cn(
                "px-3 py-1 text-xs rounded border capitalize transition-colors",
                reportType === t ? "bg-blue-600/20 border-blue-500 text-blue-400" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "ml" ? "ML Report" : t === "city" ? "City Report" : "Summary"}
            </button>
          ))}
        </div>
      </div>

      {/* Report Content */}
      <div id="report-content" ref={reportRef} className="space-y-4 bg-background p-4 rounded-xl">
        {/* Report Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>
              AQIndia Air Quality Report
            </h2>
            <p className="text-sm text-muted-foreground">
              Generated: {new Date().toLocaleString()} · City: {cities?.find((c: any) => c.id === cityId)?.name ?? cityId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">AQIndia Platform v2.0</p>
            <p className="text-xs text-muted-foreground">Data Science & Analytics</p>
          </div>
        </div>

        {/* Current AQI Summary */}
        {cityData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Current AQI", value: cityData.aqi, color },
              { label: "PM2.5 (µg/m³)", value: cityData.pm25?.toFixed(1) ?? "—", color: "#EF4444" },
              { label: "PM10 (µg/m³)", value: cityData.pm10?.toFixed(1) ?? "—", color: "#F97316" },
              { label: "Category", value: category, color },
            ].map(item => (
              <div key={item.label} className="glass-card rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold font-mono-data mt-1" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Historical Chart */}
        <div id="trend-chart-container" className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>30-Day AQI Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={(historical ?? []).map((h: any) => ({ date: h.date?.slice(5), aqi: h.aqi, pm25: h.pm25 }))}>
              <defs>
                <linearGradient id="rptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Area type="monotone" dataKey="aqi" stroke={color} fill="url(#rptGrad)" strokeWidth={2} dot={false} name="AQI" />
              <Area type="monotone" dataKey="pm25" stroke="#EF4444" fill="transparent" strokeWidth={1.5} dot={false} name="PM2.5" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pollutant Breakdown Chart */}
        {cityData && (
          <div id="pollutant-chart-container" className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>Pollutant Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { name: "PM2.5", value: cityData.pm25 ?? 0, fill: "#3B82F6" },
                  { name: "PM10", value: cityData.pm10 ?? 0, fill: "#8B5CF6" },
                  { name: "NO₂", value: cityData.no2 ?? 0, fill: "#F59E0B" },
                  { name: "SO₂", value: cityData.so2 ?? 0, fill: "#EF4444" },
                  { name: "O₃", value: cityData.o3 ?? 0, fill: "#10B981" },
                ].filter(d => d.value > 0)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Forecast Chart */}
        {forecastData && forecastData.length > 0 && (
          <div id="forecast-chart-container" className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>7-Day Forecast</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={forecastData.map((f: any) => ({
                date: f.date?.slice(5),
                aqi: f.predicted_aqi,
                lower: f.lower_80,
                upper: f.upper_80,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Area type="monotone" dataKey="aqi" stroke="#3B82F6" fill="rgba(59,130,246,0.2)" strokeWidth={2} dot={true} name="Predicted AQI" />
                <Area type="monotone" dataKey="upper" stroke="#10B981" fill="transparent" strokeWidth={1} strokeDasharray="4 4" name="Upper Bound" />
                <Area type="monotone" dataKey="lower" stroke="#EF4444" fill="transparent" strokeWidth={1} strokeDasharray="4 4" name="Lower Bound" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mann-Kendall */}
        {cityMK && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>Statistical Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Trend Direction", value: cityMK.trend, color: cityMK.trend === "increasing" ? "#EF4444" : "#22C55E" },
                { label: "Sen's Slope", value: `${cityMK.sens_slope?.toFixed(4)} AQI/day`, color: "#3B82F6" },
                { label: "p-value", value: cityMK.p_value?.toFixed(4), color: "#6B7280" },
                { label: "Significant", value: cityMK.p_value < 0.05 ? "Yes (p<0.05)" : "No", color: cityMK.p_value < 0.05 ? "#22C55E" : "#6B7280" },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-accent/30">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold mt-1 capitalize" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold" style={{ fontFamily: "Exo, sans-serif" }}>Recent Data (Last 10 Days)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-right py-2 px-3">AQI</th>
                  <th className="text-right py-2 px-3">PM2.5</th>
                  <th className="text-right py-2 px-3">PM10</th>
                  <th className="text-right py-2 px-3">NO₂</th>
                  <th className="text-right py-2 px-3">Temp</th>
                  <th className="text-right py-2 px-3">Humidity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(historical ?? []).slice(0, 10).map((row: any, i: number) => {
                  const { color: rc } = getAQICategory(row.aqi);
                  return (
                    <tr key={i} className="hover:bg-accent/20">
                      <td className="py-2 px-3">{row.date}</td>
                      <td className="py-2 px-3 text-right font-mono-data font-bold" style={{ color: rc }}>{row.aqi}</td>
                      <td className="py-2 px-3 text-right font-mono-data">{row.pm25?.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right font-mono-data">{row.pm10?.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right font-mono-data">{row.no2?.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right font-mono-data">{row.temperature?.toFixed(0)}°C</td>
                      <td className="py-2 px-3 text-right font-mono-data">{row.humidity?.toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground border-t border-border pt-3">
          AQIndia Platform · Data Science & Analytics Dashboard · All data sourced from CPCB, WAQI, OpenAQ
        </div>
      </div>
    </div>
  );
}
