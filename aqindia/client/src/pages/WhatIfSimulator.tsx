import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n-wrappers";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import {
  Sliders,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Car,
  Factory,
  Wind,
  TreePine,
  Zap,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const CITIES = [
  { id: "delhi", name: "Delhi", current_aqi: 285, pm25: 145, pm10: 220, no2: 68, so2: 22, co: 1.8, o3: 45 },
  { id: "mumbai", name: "Mumbai", current_aqi: 165, pm25: 78, pm10: 135, no2: 52, so2: 18, co: 1.2, o3: 58 },
  { id: "bangalore", name: "Bangalore", current_aqi: 125, pm25: 58, pm10: 95, no2: 42, so2: 12, co: 0.9, o3: 62 },
  { id: "chennai", name: "Chennai", current_aqi: 135, pm25: 62, pm10: 105, no2: 45, so2: 15, co: 1.0, o3: 65 },
  { id: "kolkata", name: "Kolkata", current_aqi: 195, pm25: 98, pm10: 165, no2: 58, so2: 20, co: 1.5, o3: 52 },
];

const POLLUTANT_SOURCES = [
  { name: "Vehicles", icon: Car, weight: 0.35, color: "#3B82F6" },
  { name: "Industry", icon: Factory, weight: 0.25, color: "#F59E0B" },
  { name: "Construction", icon: Wind, weight: 0.15, color: "#EF4444" },
  { name: "Agriculture", icon: TreePine, weight: 0.15, color: "#10B981" },
  { name: "Power Plants", icon: Zap, weight: 0.10, color: "#8B5CF6" },
];

export default function WhatIfSimulator() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [reductions, setReductions] = useState({
    vehicles: 0,
    industry: 0,
    construction: 0,
    agriculture: 0,
    power: 0,
  });
  const { t } = useTranslation();

  const handleReductionChange = (source: string, value: number[]) => {
    setReductions(prev => ({ ...prev, [source]: value[0] }));
  };

  const resetSimulator = () => {
    setReductions({ vehicles: 0, industry: 0, construction: 0, agriculture: 0, power: 0 });
  };

  // Calculate simulated AQI based on reductions
  const calculateSimulatedAQI = () => {
    const totalReduction = (
      reductions.vehicles * 0.35 +
      reductions.industry * 0.25 +
      reductions.construction * 0.15 +
      reductions.agriculture * 0.15 +
      reductions.power * 0.10
    );

    const reductionFactor = 1 - (totalReduction / 100);
    const simulatedAQI = Math.round(selectedCity.current_aqi * reductionFactor);
    const improvement = selectedCity.current_aqi - simulatedAQI;
    const improvementPercent = ((improvement / selectedCity.current_aqi) * 100).toFixed(1);

    const getAQICategory = (aqi: number) => {
      if (aqi <= 50) return { category: "Good", color: "#22C55E" };
      if (aqi <= 100) return { category: "Moderate", color: "#EAB308" };
      if (aqi <= 200) return { category: "Poor", color: "#F97316" };
      if (aqi <= 300) return { category: "Very Poor", color: "#EF4444" };
      return { category: "Severe", color: "#8B0000" };
    };

    const currentCategory = getAQICategory(selectedCity.current_aqi);
    const simulatedCategory = getAQICategory(simulatedAQI);

    return {
      simulatedAQI,
      improvement,
      improvementPercent,
      currentCategory,
      simulatedCategory,
      reachedGood: simulatedAQI <= 100,
      reachedModerate: simulatedAQI <= 100,
    };
  };

  const results = calculateSimulatedAQI();

  // Prepare comparison data
  const improvementNum = parseFloat(results.improvementPercent);
  const comparisonData = [
    { pollutant: "PM2.5", current: selectedCity.pm25, simulated: Math.round(selectedCity.pm25 * (1 - improvementNum / 100 * 0.9)) },
    { pollutant: "PM10", current: selectedCity.pm10, simulated: Math.round(selectedCity.pm10 * (1 - improvementNum / 100 * 0.85)) },
    { pollutant: "NO2", current: selectedCity.no2, simulated: Math.round(selectedCity.no2 * (1 - improvementNum / 100 * 0.8)) },
    { pollutant: "SO2", current: selectedCity.so2, simulated: Math.round(selectedCity.so2 * (1 - improvementNum / 100 * 0.75)) },
    { pollutant: "CO", current: Math.round(selectedCity.co * 10), simulated: Math.round(selectedCity.co * 10 * (1 - improvementNum / 100 * 0.7)) },
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Sliders className="w-8 h-8 text-blue-400" />
            {t('whatif.title', 'What-If Scenario Simulator')}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('whatif.subtitle', 'Simulate pollution reduction policies and predict air quality improvements')}
          </p>
        </div>
        <Button onClick={resetSimulator} variant="outline" className="border-white/20 hover:bg-white/10">
          <RotateCcw className="w-4 h-4 mr-2" />
          {t('whatif.resetSimulator', 'Reset Simulator')}
        </Button>
      </motion.div>

      {/* City Selector */}
      <Card className="glass-card border border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">{t('whatif.selectCity', 'Select City to Simulate')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CITIES.map((city) => (
              <button
                key={city.id}
                onClick={() => { setSelectedCity(city); resetSimulator(); }}
                className={`p-4 rounded-lg border transition-all ${
                  selectedCity.id === city.id
                    ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-gray-900/50 border-white/10 hover:border-white/20"
                }`}
              >
                <h3 className="text-sm font-bold text-foreground">{city.name}</h3>
                <p className="text-2xl font-bold mt-2" style={{ color: city.current_aqi > 200 ? "#EF4444" : city.current_aqi > 100 ? "#F97316" : "#EAB308" }}>
                  {city.current_aqi}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Current AQI</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reduction Sliders */}
        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              Pollution Source Reduction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {POLLUTANT_SOURCES.map((source) => {
              const Icon = source.icon;
              const reductionKey = source.name.toLowerCase() === "vehicles" ? "vehicles" : source.name.toLowerCase() === "industry" ? "industry" : source.name.toLowerCase() === "construction" ? "construction" : source.name.toLowerCase() === "agriculture" ? "agriculture" : "power";
              const currentValue = reductions[reductionKey as keyof typeof reductions];

              return (
                <div key={source.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: source.color }} />
                      <span className="text-sm font-semibold text-foreground">{source.name}</span>
                      <Badge variant="outline" className="text-xs">{(source.weight * 100).toFixed(0)}% impact</Badge>
                    </div>
                    <span className="text-lg font-bold" style={{ color: source.color }}>{currentValue}%</span>
                  </div>
                  <Slider
                    value={[currentValue]}
                    onValueChange={(value) => handleReductionChange(reductionKey, value)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Reduce {source.name.toLowerCase()} emissions by {currentValue}%
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="glass-card border border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Simulation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AQI Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-900/50 rounded-lg border border-white/10">
                <p className="text-xs text-muted-foreground mb-2">Current AQI</p>
                <p className="text-4xl font-bold" style={{ color: results.currentCategory.color }}>{selectedCity.current_aqi}</p>
                <Badge className={`mt-2 border ${results.currentCategory.color === "#EF4444" ? "bg-red-500/20 text-red-400 border-red-500/30" : results.currentCategory.color === "#F97316" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}`}>
                  {results.currentCategory.category}
                </Badge>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <p className="text-xs text-blue-200 mb-2">Simulated AQI</p>
                <p className="text-4xl font-bold text-blue-400">{results.simulatedAQI}</p>
                <Badge className={`mt-2 border ${results.simulatedCategory.color === "#EAB308" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : results.simulatedCategory.color === "#22C55E" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}`}>
                  {results.simulatedCategory.category}
                </Badge>
              </div>
            </div>

            {/* Improvement Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <span className="text-sm text-green-200">AQI Improvement</span>
                <span className="text-xl font-bold text-green-400">-{results.improvement} points</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <span className="text-sm text-blue-200">Improvement Percentage</span>
                <span className="text-xl font-bold text-blue-400">{results.improvementPercent}%</span>
              </div>
              {results.reachedGood && (
                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <p className="text-sm text-green-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <strong>Success!</strong> Target AQI reached - Air quality is now "Good"
                  </p>
                </div>
              )}
            </div>

            {/* Quick Recommendations */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <h4 className="text-sm font-semibold text-yellow-200 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Policy Recommendation
              </h4>
              <p className="text-xs text-yellow-100">
                {results.simulatedAQI > 200
                  ? "Multiple interventions needed. Consider combining vehicle restrictions with industrial emission controls."
                  : results.simulatedAQI > 100
                  ? "Good progress! Additional 20-30% reduction needed to reach 'Moderate' level."
                  : "Excellent! Current policies are sufficient to maintain healthy air quality."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pollutant Breakdown Chart */}
      <Card className="glass-card border border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-400" />
            Pollutant Level Comparison (Before vs After)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="pollutant" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="current" fill="#EF4444" name="Current Levels" />
              <Bar dataKey="simulated" fill="#3B82F6" name="Simulated Levels" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Source Impact Summary */}
      <Card className="glass-card border border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Pollution Source Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {POLLUTANT_SOURCES.map((source) => {
              const Icon = source.icon;
              const reductionKey = source.name.toLowerCase() === "vehicles" ? "vehicles" : source.name.toLowerCase() === "industry" ? "industry" : source.name.toLowerCase() === "construction" ? "construction" : source.name.toLowerCase() === "agriculture" ? "agriculture" : "power";
              const currentValue = reductions[reductionKey as keyof typeof reductions];
              const impactReduction = Math.round(currentValue * source.weight);

              return (
                <div key={source.name} className="p-4 bg-gray-900/50 rounded-lg border border-white/5 text-center">
                  <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: source.color }} />
                  <h4 className="text-sm font-semibold text-foreground mb-1">{source.name}</h4>
                  <p className="text-2xl font-bold" style={{ color: source.color }}>{currentValue}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Reduction</p>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-xs text-muted-foreground">Impact on AQI</p>
                    <p className="text-lg font-bold text-green-400">-{impactReduction}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
