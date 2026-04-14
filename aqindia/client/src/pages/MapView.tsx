import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getAQICategory } from "@/lib/aqi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, RefreshCw, Info } from "lucide-react";
import { useTranslation } from "@/i18n-wrappers";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import FloatingGuide from "@/components/FloatingGuide";
import { helpContent } from "@/lib/helpContent";

// Fix Leaflet's default marker icon issue
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function CityMarker({ city, onClick }: { city: any; onClick: () => void }) {
  const { color, category } = getAQICategory(city.aqi);
  const size = city.aqi > 200 ? 12 : city.aqi > 150 ? 10 : 8;
  const { t } = useTranslation();

  return (
    <CircleMarker
      center={[city.lat, city.lon]}
      radius={size}
      fillColor={color}
      color={color}
      weight={2}
      opacity={0.9}
      fillOpacity={0.7}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup>
        <div className="text-center">
          <h3 className="font-bold text-base">{city.name}</h3>
          <p className="text-xs text-gray-500 mb-2">{city.state}</p>
          <div className="text-3xl font-bold" style={{ color }}>{city.aqi}</div>
          <p className="text-sm font-medium" style={{ color }}>{category}</p>
          <Link href={`/city/${city.id}`}>
            <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
              {t('map.viewDetails', 'View Details')}
            </button>
          </Link>
        </div>
      </Popup>
    </CircleMarker>
  );
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapView() {
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");
  const mapCenter: [number, number] = [22.5937, 78.9629]; // Center of India
  const mapZoom = 5;
  const { t } = useTranslation();

  const { data: aqiData, isLoading, refetch } = trpc.aqi.all.useQuery();

  const cities = useMemo(() => {
    if (!aqiData?.data) return [];
    const data = aqiData.data;
    if (filter === "all") return data;
    return data.filter((c: any) => getAQICategory(c.aqi).category === filter);
  }, [aqiData, filter]);

  const CATEGORIES = ["Good", "Moderate", "Poor", "Very Poor", "Severe"];
  const CATEGORY_COLORS: Record<string, string> = {
    Good: "#22C55E", Moderate: "#EAB308", Poor: "#F97316", "Very Poor": "#EF4444", Severe: "#8B0000"
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Exo, sans-serif" }}>{t('map.title', 'India AQI Map')}</h1>
            <p className="text-sm text-muted-foreground">{t('map.subtitle', 'Real-time air quality across India')}</p>
          </div>
          <FloatingGuide content={helpContent.mapView} />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          {t('common.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={cn("px-3 py-1 rounded-full text-xs border transition-colors", filter === "all" ? "bg-blue-600/20 border-blue-500 text-blue-400" : "border-border text-muted-foreground hover:text-foreground")}
        >
          {t('map.allCities', 'All Cities')}
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn("px-3 py-1 rounded-full text-xs border transition-colors", filter === cat ? "text-white" : "text-muted-foreground hover:text-foreground border-border")}
            style={filter === cat ? { backgroundColor: CATEGORY_COLORS[cat] + "33", borderColor: CATEGORY_COLORS[cat], color: CATEGORY_COLORS[cat] } : {}}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Interactive Leaflet Map */}
        <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden relative" style={{ minHeight: 600 }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="skeleton w-full h-full" />
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%", zIndex: 0 }}
              zoomControl={true}
              scrollWheelZoom={true}
            >
              {/* OpenStreetMap tiles (FREE, no API key needed) */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* City markers */}
              {cities.map((city: any) => (
                <CityMarker
                  key={city.id}
                  city={city}
                  onClick={() => setSelectedCity(city)}
                />
              ))}
            </MapContainer>
          )}

          {/* City count overlay */}
          <div className="absolute bottom-3 left-3 z-[1000] text-xs text-muted-foreground bg-card/90 px-3 py-1.5 rounded-lg border border-border">
            {t('map.citiesShown', '{count} cities shown').replace('{count}', String(cities.length))}
          </div>
        </div>

        {/* City Info Panel */}
        <div className="space-y-3">
          {selectedCity ? (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg" style={{ fontFamily: "Exo, sans-serif" }}>{selectedCity.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedCity.state}</p>
                </div>
                <button onClick={() => setSelectedCity(null)} className="text-muted-foreground hover:text-foreground">×</button>
              </div>

              {(() => {
                const { color, category, bgClass } = getAQICategory(selectedCity.aqi);
                return (
                  <div className={cn("rounded-lg p-3 border mb-3", bgClass)}>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold font-mono-data" style={{ color }}>{selectedCity.aqi}</span>
                      <span className="text-sm mb-1" style={{ color }}>{category}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: t('city.pm25', 'PM2.5'), value: `${selectedCity.pm25?.toFixed(1) ?? "—"} µg/m³` },
                  { label: t('city.pm10', 'PM10'), value: `${selectedCity.pm10?.toFixed(1) ?? "—"} µg/m³` },
                  { label: 'NO₂', value: `${selectedCity.no2?.toFixed(1) ?? "—"} µg/m³` },
                  { label: t('city.temperature', 'Temperature'), value: `${selectedCity.temperature?.toFixed(0) ?? "—"}°C` },
                  { label: t('city.humidity', 'Humidity'), value: `${selectedCity.humidity?.toFixed(0) ?? "—"}%` },
                  { label: t('city.wind', 'Wind'), value: `${selectedCity.wind_speed?.toFixed(1) ?? "—"} m/s` },
                ].map(item => (
                  <div key={item.label} className="p-2 rounded bg-accent/30">
                    <p className="text-muted-foreground">{item.label}</p>
                    <p className="font-mono-data font-medium text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <Link href={`/city/${selectedCity.id}`} className="flex-1">
                  <Button size="sm" className="w-full gap-1">
                    <Info className="w-3.5 h-3.5" />
                    {t('city.details', 'Details')}
                  </Button>
                </Link>
                <Link href={`/forecast?city=${selectedCity.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">{t('city.forecast', 'Forecast')}</Button>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                {t('city.source', 'Source')}: {selectedCity.data_source}
              </p>
            </motion.div>
          ) : (
            <div className="glass-card rounded-xl p-4 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('map.clickCity', 'Click a city dot on the map to see details')}</p>
            </div>
          )}

          {/* Top 10 Worst */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "Exo, sans-serif" }}>{t('map.mostPolluted', 'Most Polluted')}</h3>
            <div className="space-y-2">
              {(aqiData?.data ?? [])
                .sort((a: any, b: any) => b.aqi - a.aqi)
                .slice(0, 8)
                .map((city: any, i: number) => {
                  const { color } = getAQICategory(city.aqi);
                  return (
                    <button
                      key={city.id}
                      onClick={() => setSelectedCity(city)}
                      className="w-full flex items-center gap-2 hover:bg-accent/50 rounded p-1 transition-colors text-left"
                    >
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-xs flex-1 truncate">{city.name}</span>
                      <span className="text-xs font-mono-data font-bold" style={{ color }}>{city.aqi}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
