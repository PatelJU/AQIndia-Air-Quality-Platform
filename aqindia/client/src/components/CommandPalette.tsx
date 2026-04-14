import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Map, BarChart3, TrendingUp, GitCompare, LineChart, Brain, FlaskConical, Heart, FileText, Key, Info, Clock, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface SearchItem {
  id: string;
  label: string;
  description: string;
  category: "page" | "city" | "feature" | "action";
  icon: any;
  path?: string;
  keywords: string[];
}

const SEARCH_ITEMS: SearchItem[] = [
  // Pages
  { id: "home", label: "Home - Overview", description: "Real-time AQI monitoring for 108 cities", category: "page", icon: BarChart3, path: "/", keywords: ["home", "dashboard", "overview", "main"] },
  { id: "map", label: "India Map View", description: "Interactive map with 108 cities", category: "page", icon: Map, path: "/map", keywords: ["map", "india", "geography", "location"] },
  { id: "rankings", label: "City Rankings", description: "Sortable city rankings by AQI", category: "page", icon: BarChart3, path: "/rankings", keywords: ["ranking", "sort", "compare", "top"] },
  { id: "forecast", label: "AQI Forecast", description: "ML predictions for 14/30/90 days", category: "page", icon: TrendingUp, path: "/forecast", keywords: ["forecast", "prediction", "future", "ml"] },
  { id: "comparison", label: "City Comparison", description: "Multi-city side-by-side analysis", category: "page", icon: GitCompare, path: "/comparison", keywords: ["compare", "comparison", "cities", "versus"] },
  { id: "analytics", label: "Analytics Dashboard", description: "Statistical analysis and trends", category: "page", icon: LineChart, path: "/analytics", keywords: ["analytics", "statistics", "trends", "analysis"] },
  { id: "ml", label: "ML Predictions", description: "5 ML models with SHAP explainability", category: "page", icon: Brain, path: "/ml-predictions", keywords: ["ml", "machine learning", "models", "shap", "prediction"] },
  { id: "datascience", label: "Data Science Dashboard", description: "Pipeline status and diagnostics", category: "page", icon: FlaskConical, path: "/data-science", keywords: ["data science", "pipeline", "diagnostics", "status"] },
  { id: "health", label: "Health Advisory", description: "AQI-based health recommendations", category: "page", icon: Heart, path: "/health", keywords: ["health", "advisory", "recommendations", "safety"] },
  { id: "reports", label: "Reports", description: "PDF/CSV export and sharing", category: "page", icon: FileText, path: "/reports", keywords: ["reports", "export", "pdf", "csv", "download"] },
  { id: "settings", label: "API Settings", description: "Manage API keys and providers", category: "page", icon: Key, path: "/settings", keywords: ["settings", "api", "keys", "configuration"] },
  { id: "about", label: "About", description: "Project documentation and info", category: "page", icon: Info, path: "/about", keywords: ["about", "info", "documentation", "help"] },

  // Features
  { id: "live-aqi", label: "Live AQI Data", description: "Real-time air quality from WAQI + Open-Meteo", category: "feature", icon: TrendingUp, keywords: ["live", "real-time", "waqi", "open-meteo", "aqi"] },
  { id: "historical", label: "Historical Data", description: "65,760+ records from 2015-2024", category: "feature", icon: LineChart, keywords: ["historical", "history", "past", "data", "kaggle"] },
  { id: "mann-kendall", label: "Mann-Kendall Trend Test", description: "Statistical trend detection", category: "feature", icon: LineChart, keywords: ["mann-kendall", "trend", "statistical", "test", "significance"] },
  { id: "shap", label: "SHAP Values", description: "Model explainability and feature importance", category: "feature", icon: Brain, keywords: ["shap", "explainability", "feature", "importance", "interpret"] },
  { id: "festival", label: "Festival Impact Analysis", description: "Diwali, Holi effects on AQI", category: "feature", icon: Heart, keywords: ["festival", "diwali", "holi", "impact", "celebration"] },

  // Actions
  { id: "export-csv", label: "Export Data as CSV", description: "Download air quality data", category: "action", icon: FileText, path: "/reports", keywords: ["export", "csv", "download", "data"] },
  { id: "export-pdf", label: "Generate PDF Report", description: "Create detailed report", category: "action", icon: FileText, path: "/reports", keywords: ["export", "pdf", "report", "generate"] },
];

const RECENT_SEARCHES_KEY = "aqindia-recent-searches";

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(searchId: string) {
  try {
    const recent = getRecentSearches();
    const updated = [searchId, ...recent.filter(id => id !== searchId)].slice(0, 5);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches when opening
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setSearchQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter search results
  const filteredResults = searchQuery.length > 0
    ? SEARCH_ITEMS.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
          item.label.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.keywords.some(keyword => keyword.toLowerCase().includes(query))
        );
      })
    : [];

  // Show recent searches if no query
  const displayItems = searchQuery.length === 0
    ? recentSearches.map(id => SEARCH_ITEMS.find(item => item.id === id)).filter(Boolean) as SearchItem[]
    : filteredResults;

  // Handle item selection
  const handleSelect = useCallback((item: SearchItem) => {
    saveRecentSearch(item.id);
    if (item.path) {
      navigate(item.path);
    }
    setIsOpen(false);
  }, [navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || displayItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % displayItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + displayItems.length) % displayItems.length);
      } else if (e.key === "Enter" && displayItems[selectedIndex]) {
        e.preventDefault();
        handleSelect(displayItems[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, displayItems, selectedIndex, handleSelect]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "page": return BarChart3;
      case "feature": return FlaskConical;
      case "action": return FileText;
      default: return Search;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "page": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "feature": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "action": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-gray-900/50 hover:bg-white/5 hover:border-white/20 transition-all text-sm text-muted-foreground"
        title="Search (Ctrl+K)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 ml-2">
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 border border-white/20">Ctrl</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 border border-white/20">K</span>
        </kbd>
      </button>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0 bg-gray-950 border border-white/10 shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages, features, cities..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-1 hover:bg-white/10 rounded">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-96 overflow-y-auto">
            <AnimatePresence>
              {displayItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-12 text-center"
                >
                  <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No results found</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Try different keywords</p>
                </motion.div>
              ) : (
                <div className="py-2">
                  {/* Header for recent searches */}
                  {searchQuery.length === 0 && recentSearches.length > 0 && (
                    <div className="px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Recent Searches</span>
                    </div>
                  )}

                  {displayItems.map((item, index) => {
                    const Icon = item.icon;
                    const CategoryIcon = getCategoryIcon(item.category);

                    return (
                      <motion.button
                        key={item.id}
                        data-index={index}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                          index === selectedIndex
                            ? "bg-blue-600/20 border-l-2 border-blue-500"
                            : "hover:bg-white/5 border-l-2 border-transparent"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${index === selectedIndex ? "bg-blue-500/30" : "bg-white/5"}`}>
                          <Icon className="w-4 h-4 text-foreground" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs border ${getCategoryColor(item.category)}`}>
                            <CategoryIcon className="w-3 h-3 mr-1" />
                            {item.category}
                          </Badge>
                          {item.path && (
                            <ArrowRight className={`w-4 h-4 ${index === selectedIndex ? "text-blue-400" : "text-muted-foreground/30"}`} />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20">Enter</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
            <span>{displayItems.length} result{displayItems.length !== 1 ? "s" : ""}</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
