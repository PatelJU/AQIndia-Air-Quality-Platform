import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getAQICategory, REGIONS } from "@/lib/aqi";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trophy, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n-wrappers";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";

export default function Rankings() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"aqi_desc" | "aqi_asc" | "name" | "region">("aqi_desc");
  const { t } = useTranslation();

  const { data: rankings, isLoading, error } = trpc.aqi.rankings.useQuery({
    search: search || undefined,
    region: region !== "all" ? region : undefined,
    category: category !== "all" ? category : undefined,
    sortBy,
  });

  // Error handling with contextual logging
  if (error) {
    console.error("[Rankings] Failed to fetch rankings data:", {
      error: error.message,
      filters: { search, region, category, sortBy },
      timestamp: new Date().toISOString()
    });
  }

  const top10 = (rankings ?? []).slice(0, 10);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>{t('rankings.title', 'City Rankings')}</h1>
            <p className="text-sm text-muted-foreground">{t('rankings.subtitle', 'Air quality rankings across all monitored cities')}</p>
            {rankings && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">
                  📊 Showing {(rankings as any[]).length} cities • Updated {new Date().toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          <FloatingGuide content={helpContent.rankings} />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t('rankings.loading', 'Loading rankings...')}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card rounded-xl p-8 text-center border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">{t('rankings.error', 'Failed to load rankings')}: {error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && top10.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">{t('rankings.noCities', 'No cities match your filters')}</p>
        </div>
      )}

      {/* Top 10 Bar Chart */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "Exo, sans-serif" }}>
          {t('rankings.top10', 'Top 10 Most Polluted Cities')}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={top10} layout="vertical" margin={{ left: 60, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} width={60} />
            <Tooltip
              contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="aqi" radius={[0, 4, 4, 0]} name="AQI">
              {top10.map((entry: any) => (
                <Cell key={entry.id} fill={getAQICategory(entry.aqi).color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder={t('rankings.searchCities', 'Search cities...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm bg-card border-border"
          />
        </div>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-36 h-8 text-sm bg-card border-border">
            <SelectValue placeholder={t('rankings.region', 'Region')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('rankings.allRegions', 'All Regions')}</SelectItem>
            {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-36 h-8 text-sm bg-card border-border">
            <SelectValue placeholder={t('rankings.category', 'Category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('rankings.allCategories', 'All Categories')}</SelectItem>
            {["Good", "Moderate", "Poor", "Very Poor", "Severe"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
          <SelectTrigger className="w-36 h-8 text-sm bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aqi_desc">{t('rankings.worstFirst', 'Worst First')}</SelectItem>
            <SelectItem value="aqi_asc">{t('rankings.bestFirst', 'Best First')}</SelectItem>
            <SelectItem value="name">{t('rankings.nameAZ', 'Name A-Z')}</SelectItem>
            <SelectItem value="region">{t('rankings.byRegion', 'By Region')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rankings Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-xs text-muted-foreground font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-3">City</div>
          <div className="col-span-2">State</div>
          <div className="col-span-1">Region</div>
          <div className="col-span-2 text-right">AQI</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1 text-right">PM2.5</div>
        </div>

        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 15 }).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {(rankings ?? []).map((city: any, i: number) => {
              const { color, category: cat, bgClass } = getAQICategory(city.aqi);
              return (
                <motion.div
                  key={city.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-accent/30 transition-colors items-center"
                >
                  <div className="col-span-1 flex items-center gap-1">
                    {i < 3 ? (
                      <Trophy className="w-3.5 h-3.5" style={{ color: ["#FFD700", "#C0C0C0", "#CD7F32"][i] }} />
                    ) : (
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    )}
                  </div>
                  <div className="col-span-3">
                    <Link href={`/city/${city.id}`}>
                      <span className="text-sm font-medium hover:text-blue-400 cursor-pointer transition-colors">
                        {city.name}
                      </span>
                    </Link>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground truncate">{city.state}</div>
                  <div className="col-span-1 text-xs text-muted-foreground">{city.region}</div>
                  <div className="col-span-2 text-right">
                    <span className="text-base font-bold font-mono-data" style={{ color, fontFamily: "Roboto Mono, monospace" }}>
                      {city.aqi}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>
                      {cat}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-right text-xs font-mono-data text-muted-foreground">
                    {city.pm25?.toFixed(0) ?? "—"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {rankings?.length ?? 0} cities · Updated every 5 minutes
      </p>
    </div>
  );
}
