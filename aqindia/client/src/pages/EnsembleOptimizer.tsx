import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/i18n-wrappers";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Brain,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  Activity,
  BarChart3,
  ArrowRight,
  Info,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";

const CITIES = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata"];

const modelPerformance = {
  Delhi: {
    random_forest: { accuracy: 0.89, mae: 12.3, rmse: 15.8, confidence: 0.85 },
    xgboost: { accuracy: 0.92, mae: 10.5, rmse: 13.2, confidence: 0.88 },
    lstm: { accuracy: 0.85, mae: 14.7, rmse: 18.3, confidence: 0.79 },
    prophet: { accuracy: 0.87, mae: 13.2, rmse: 16.5, confidence: 0.82 },
    ensemble: { accuracy: 0.94, mae: 9.2, rmse: 11.8, confidence: 0.91 },
  },
  Mumbai: {
    random_forest: { accuracy: 0.91, mae: 11.2, rmse: 14.3, confidence: 0.87 },
    xgboost: { accuracy: 0.90, mae: 11.8, rmse: 14.9, confidence: 0.86 },
    lstm: { accuracy: 0.88, mae: 12.9, rmse: 16.2, confidence: 0.84 },
    prophet: { accuracy: 0.89, mae: 12.3, rmse: 15.5, confidence: 0.85 },
    ensemble: { accuracy: 0.93, mae: 10.1, rmse: 12.8, confidence: 0.89 },
  },
  Bangalore: {
    random_forest: { accuracy: 0.93, mae: 9.8, rmse: 12.5, confidence: 0.89 },
    xgboost: { accuracy: 0.94, mae: 9.2, rmse: 11.8, confidence: 0.90 },
    lstm: { accuracy: 0.90, mae: 11.5, rmse: 14.2, confidence: 0.86 },
    prophet: { accuracy: 0.91, mae: 10.8, rmse: 13.5, confidence: 0.87 },
    ensemble: { accuracy: 0.95, mae: 8.5, rmse: 10.8, confidence: 0.92 },
  },
  Chennai: {
    random_forest: { accuracy: 0.90, mae: 11.5, rmse: 14.8, confidence: 0.86 },
    xgboost: { accuracy: 0.91, mae: 10.9, rmse: 13.8, confidence: 0.87 },
    lstm: { accuracy: 0.87, mae: 13.5, rmse: 16.9, confidence: 0.83 },
    prophet: { accuracy: 0.88, mae: 12.8, rmse: 15.9, confidence: 0.84 },
    ensemble: { accuracy: 0.93, mae: 9.8, rmse: 12.3, confidence: 0.89 },
  },
  Kolkata: {
    random_forest: { accuracy: 0.88, mae: 12.8, rmse: 16.2, confidence: 0.84 },
    xgboost: { accuracy: 0.90, mae: 11.5, rmse: 14.5, confidence: 0.86 },
    lstm: { accuracy: 0.84, mae: 15.2, rmse: 18.9, confidence: 0.80 },
    prophet: { accuracy: 0.86, mae: 13.9, rmse: 17.3, confidence: 0.82 },
    ensemble: { accuracy: 0.92, mae: 10.3, rmse: 13.1, confidence: 0.88 },
  },
};

const uncertaintyData = [
  { aqi_range: "0-50", uncertainty: 0.05, confidence: 0.95, models_agree: 1.0 },
  { aqi_range: "51-100", uncertainty: 0.08, confidence: 0.92, models_agree: 0.96 },
  { aqi_range: "101-150", uncertainty: 0.12, confidence: 0.88, models_agree: 0.91 },
  { aqi_range: "151-200", uncertainty: 0.15, confidence: 0.85, models_agree: 0.87 },
  { aqi_range: "201-250", uncertainty: 0.18, confidence: 0.82, models_agree: 0.83 },
  { aqi_range: "251-300", uncertainty: 0.22, confidence: 0.78, models_agree: 0.79 },
  { aqi_range: "301+", uncertainty: 0.28, confidence: 0.72, models_agree: 0.74 },
];

export default function EnsembleOptimizer() {
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [weights, setWeights] = useState({
    random_forest: 0.25,
    xgboost: 0.30,
    lstm: 0.15,
    prophet: 0.15,
    ensemble: 0.15,
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { t } = useTranslation();

  const handleWeightChange = (model: string, value: number[]) => {
    setWeights(prev => ({ ...prev, [model]: value[0] / 100 }));
  };

  const autoOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const cityData = modelPerformance[selectedCity as keyof typeof modelPerformance];
      const totalAccuracy = Object.values(cityData).reduce((sum, m) => sum + m.accuracy, 0);

      setWeights({
        random_forest: Math.round((cityData.random_forest.accuracy / totalAccuracy) * 100) / 100,
        xgboost: Math.round((cityData.xgboost.accuracy / totalAccuracy) * 100) / 100,
        lstm: Math.round((cityData.lstm.accuracy / totalAccuracy) * 100) / 100,
        prophet: Math.round((cityData.prophet.accuracy / totalAccuracy) * 100) / 100,
        ensemble: Math.round((cityData.ensemble.accuracy / totalAccuracy) * 100) / 100,
      });
      setIsOptimizing(false);
    }, 1000);
  };

  const cityData = modelPerformance[selectedCity as keyof typeof modelPerformance];
  const bestModel = Object.entries(cityData).reduce((best, [name, data]) => 
    data.accuracy > (cityData[best as keyof typeof cityData]?.accuracy || 0) ? name : best
  , "random_forest");

  const modelComparisonData = Object.entries(cityData).map(([name, data]) => ({
    model: name.replace("_", " ").toUpperCase(),
    accuracy: data.accuracy,
    confidence: data.confidence,
    mae: data.mae,
    is_best: name === bestModel,
  }));

  const getBestModelRecommendation = () => {
    const accuracy = cityData[bestModel as keyof typeof cityData].accuracy;
    if (accuracy > 0.93) return { text: "Excellent", color: "text-green-400", bg: "bg-green-500/20" };
    if (accuracy > 0.90) return { text: "Very Good", color: "text-blue-400", bg: "bg-blue-500/20" };
    if (accuracy > 0.85) return { text: "Good", color: "text-yellow-400", bg: "bg-yellow-500/20" };
    return { text: "Needs Improvement", color: "text-red-400", bg: "bg-red-500/20" };
  };

  const recommendation = getBestModelRecommendation();

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-400" />
            ML {t('ensemble.title', 'Ensemble Optimizer')}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('ensemble.subtitle', 'Dynamic model weights, confidence intervals, and uncertainty quantification')}
          </p>
        </div>
        <Button onClick={autoOptimize} disabled={isOptimizing} className="bg-blue-600 hover:bg-blue-700">
          <Settings className={`w-4 h-4 mr-2 ${isOptimizing ? "animate-spin" : ""}`} />
          {t('ensemble.autoOptimize', 'Auto-Optimize Weights')}
        </Button>
      </motion.div>

      {/* City Selector */}
      <Card className="glass-card border border-white/10">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">{t('ensemble.selectCity', 'Select City for Analysis')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedCity === city
                    ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-gray-900/50 border-white/10 hover:border-white/20"
                }`}
              >
                <h3 className="text-sm font-bold text-foreground">{city}</h3>
                <Badge className={`mt-2 border ${recommendation.bg} ${recommendation.color}`}>
                  {recommendation.text}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="weights" className="space-y-4">
        <TabsList className="bg-gray-900 border border-white/10">
          <TabsTrigger value="weights" className="data-[state=active]:bg-blue-600">
            <Settings className="w-4 h-4 mr-2" />
            Dynamic Weights
          </TabsTrigger>
          <TabsTrigger value="confidence" className="data-[state=active]:bg-blue-600">
            <Target className="w-4 h-4 mr-2" />
            Confidence Intervals
          </TabsTrigger>
          <TabsTrigger value="uncertainty" className="data-[state=active]:bg-blue-600">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Uncertainty Analysis
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-blue-600">
            <Zap className="w-4 h-4 mr-2" />
            Best Model Guide
          </TabsTrigger>
        </TabsList>

        {/* Dynamic Weights Tab */}
        <TabsContent value="weights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Model Weight Adjustment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(weights).map(([model, weight]) => (
                  <div key={model} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground capitalize">
                        {model.replace("_", " ")}
                      </span>
                      <span className="text-lg font-bold text-blue-400">{(weight * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[weight * 100]}
                      onValueChange={(value) => handleWeightChange(model, value)}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Weight Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(weights).map(([model, weight]) => ({
                    model: model.replace("_", " ").toUpperCase(),
                    weight: weight * 100,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="model" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <Bar dataKey="weight" fill="#3B82F6" name="Weight %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Confidence Intervals Tab */}
        <TabsContent value="confidence">
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Model Confidence Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={modelComparisonData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="model" stroke="rgba(255,255,255,0.5)" />
                  <PolarRadiusAxis domain={[0, 1]} stroke="rgba(255,255,255,0.3)" />
                  <Radar name="Accuracy" dataKey="accuracy" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Radar name="Confidence" dataKey="confidence" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Uncertainty Analysis Tab */}
        <TabsContent value="uncertainty">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Uncertainty by AQI Range</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={uncertaintyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="aqi_range" stroke="rgba(255,255,255,0.5)" />
                    <YAxis domain={[0, 1]} stroke="rgba(255,255,255,0.5)" />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <Legend />
                    <Area type="monotone" dataKey="uncertainty" stroke="#EF4444" fill="rgba(239,68,68,0.2)" name="Uncertainty" />
                    <Area type="monotone" dataKey="confidence" stroke="#10B981" fill="rgba(16,185,129,0.2)" name="Confidence" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">When to Trust Which Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h4 className="font-bold text-green-200">Low AQI (0-100)</h4>
                  </div>
                  <p className="text-sm text-green-100">All models perform well. Use ensemble for best accuracy (95% confidence).</p>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h4 className="font-bold text-yellow-200">Moderate AQI (101-200)</h4>
                  </div>
                  <p className="text-sm text-yellow-100">XGBoost and Random Forest are most reliable. Avoid LSTM predictions.</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h4 className="font-bold text-red-200">High AQI (201+)</h4>
                  </div>
                  <p className="text-sm text-red-100">High uncertainty. Use ensemble with wider confidence intervals. Verify with multiple sources.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Best Model Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                AI-Powered Model Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Best Model for Selected City */}
              <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">Best Model for {selectedCity}</h3>
                    <p className="text-sm text-muted-foreground">Based on historical accuracy and confidence</p>
                  </div>
                  <Badge className={`border ${recommendation.bg} ${recommendation.color} text-lg px-4 py-2`}>
                    {recommendation.text}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Recommended Model</p>
                    <p className="text-2xl font-bold text-blue-400 capitalize">{bestModel.replace("_", " ")}</p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-green-400">{(cityData[bestModel as keyof typeof cityData].accuracy * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-purple-400">{(cityData[bestModel as keyof typeof cityData].confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* All Models Comparison */}
              <div className="space-y-3">
                <h4 className="text-lg font-bold text-foreground">All Models Performance</h4>
                {Object.entries(cityData)
                  .sort(([, a], [, b]) => b.accuracy - a.accuracy)
                  .map(([model, data], index) => (
                    <div key={model} className="p-4 bg-gray-900/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? "bg-yellow-500/20 text-yellow-400" : 
                            index === 1 ? "bg-gray-400/20 text-gray-300" : 
                            index === 2 ? "bg-orange-500/20 text-orange-400" : 
                            "bg-blue-500/20 text-blue-400"
                          }`}>
                            #{index + 1}
                          </div>
                          <h5 className="text-sm font-bold text-foreground capitalize">{model.replace("_", " ")}</h5>
                        </div>
                        <Badge className={index === 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                          {(data.accuracy * 100).toFixed(1)}% accuracy
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">MAE</p>
                          <p className="text-lg font-bold text-foreground">{data.mae.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">RMSE</p>
                          <p className="text-lg font-bold text-foreground">{data.rmse.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Confidence</p>
                          <p className="text-lg font-bold text-purple-400">{(data.confidence * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                      <Progress value={data.accuracy * 100} className="mt-3 h-2" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
