import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Github, Brain, Database, BarChart2, Shield, Zap, Globe } from "lucide-react";
import { useTranslation } from "@/i18n-wrappers";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";

const TECH_STACK = [
  { category: "Frontend", items: ["React 19", "TypeScript", "Tailwind CSS 4", "Framer Motion", "Recharts", "shadcn/ui"] },
  { category: "Backend", items: ["Node.js", "Express", "tRPC 11", "Drizzle ORM", "MySQL/TiDB"] },
  { category: "ML/Data Science", items: ["XGBoost", "Random Forest", "LSTM (TensorFlow)", "Prophet", "SHAP", "scikit-learn"] },
  { category: "Statistical Analysis", items: ["Mann-Kendall Test", "Sen's Slope", "Pearson Correlation", "NMF Source Apportionment", "Seasonal Decomposition"] },
  { category: "Data Sources", items: ["CPCB India", "OpenAQ", "WAQI", "Open-Meteo", "NASA FIRMS"] },
  { category: "AI/Validation", items: ["Google Gemini AI", "AES-256 Encryption", "Multi-key Load Balancing"] },
];

const FEATURES = [
  { icon: Globe, title: "108 Indian Cities", desc: "Live air quality data from cities across India, updated regularly", color: "#3B82F6" },
  { icon: Brain, title: "5 ML Models", desc: "XGBoost, Random Forest, LSTM, Prophet, and Ensemble stacking for predictions", color: "#8B5CF6" },
  { icon: BarChart2, title: "12+ Chart Types", desc: "Area, radar, heatmap, box plot, violin, scatter, parallel coords, SHAP plots", color: "#10B981" },
  { icon: Zap, title: "Optional AI Validation", desc: "Add a free Gemini API key for smarter data checks, or use built-in validation", color: "#F59E0B" },
  { icon: Database, title: "Historical Data", desc: "Years of AQI records from 2015-2025 with trend analysis", color: "#EF4444" },
  { icon: Shield, title: "Secure & Private", desc: "API keys encrypted on your device, never sent to our servers", color: "#22C55E" },
];

export default function About() {
  const { t } = useTranslation();
  
  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-4">
          <Zap className="w-3.5 h-3.5" />
          {t('about.finalYear', 'Final Year Data Science Project')}
        </div>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>
          AQIndia
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('about.description', 'A platform that tracks air quality across India. It uses machine learning to predict pollution levels and helps people understand the air they breathe.')}
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Badge variant="outline" className="text-sm">v2.0.0</Badge>
          <Badge variant="outline" className="text-sm text-green-400 border-green-500/30">Production Ready</Badge>
          <Badge variant="outline" className="text-sm text-purple-400 border-purple-500/30">ML Powered</Badge>
          <FloatingGuide content={helpContent.about} />
        </div>
      </motion.div>

      {/* Key Features */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('about.keyFeatures', 'Key Features')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: feature.color + "20" }}>
                  <feature.icon className="w-4 h-4" style={{ color: feature.color }} />
                </div>
                <h3 className="font-semibold text-sm" style={{ fontFamily: "Exo, sans-serif" }}>{feature.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('about.techStack', 'Technology Stack')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TECH_STACK.map((cat, i) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4"
            >
              <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: "Exo, sans-serif" }}>{cat.category}</h3>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map(item => (
                  <Badge key={item} variant="outline" className="text-xs">{item}</Badge>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Project Info */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('about.projectInfo', 'Project Information')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {[
              { label: "Project Type", value: "Final Year Data Science & Analytics Project" },
              { label: "Domain", value: "Environmental Data Science, Air Quality Monitoring" },
              { label: "Dataset Period", value: "2020–2025 (5 years)" },
              { label: "Cities Covered", value: "126 Indian cities across 28 states" },
              { label: "Total Records", value: "65,760+ historical AQI records" },
              { label: "ML Models", value: "XGBoost, Random Forest, LSTM, Prophet, Ensemble" },
            ].map(item => (
              <div key={item.label} className="flex gap-3">
                <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{item.label}</span>
                <span className="text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[
              { label: "Statistical Tests", value: "Mann-Kendall, Sen's Slope, Pearson, t-test" },
              { label: "Feature Engineering", value: "60 features: temporal, meteorological, lag, derived" },
              { label: "Forecast Horizons", value: "24h, 72h, 7d, 30d, quarterly, annual" },
              { label: "Chart Types", value: "12+ including SHAP beeswarm, violin, parallel coords" },
              { label: "Data Sources", value: "CPCB, OpenAQ, WAQI, Open-Meteo, NASA FIRMS" },
              { label: "AI Validation", value: "Google Gemini AI (optional, free tier)" },
            ].map(item => (
              <div key={item.label} className="flex gap-3">
                <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{item.label}</span>
                <span className="text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="glass-card rounded-xl p-4">
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>{t('about.dataSources', 'Data Sources & Attribution')}</h2>
        <div className="space-y-2">
          {[
            { name: "CPCB (Central Pollution Control Board)", url: "https://cpcb.nic.in", desc: "Official Indian government air quality data" },
            { name: "OpenAQ", url: "https://openaq.org", desc: "Open-source air quality data platform" },
            { name: "WAQI (World Air Quality Index)", url: "https://waqi.info", desc: "Global AQI monitoring network" },
            { name: "Open-Meteo", url: "https://open-meteo.com", desc: "Free weather and air quality API" },
            { name: "NASA FIRMS", url: "https://firms.modaps.eosdis.nasa.gov", desc: "Satellite fire and aerosol data" },
            { name: "Google Gemini AI", url: "https://ai.google.dev", desc: "AI validation and data verification" },
          ].map(src => (
            <div key={src.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/30">
              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{src.name}</p>
                <p className="text-xs text-muted-foreground">{src.desc}</p>
              </div>
              <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground py-4">
        <p>{t('about.footer', 'AQIndia Platform v2.0 · Built with React, TypeScript, and ❤️ for clean air')}</p>
        <p className="mt-1">{t('about.footerNote', 'All data is sourced from free, open-source APIs. No premium subscriptions required.')}</p>
      </div>
    </div>
  );
}
