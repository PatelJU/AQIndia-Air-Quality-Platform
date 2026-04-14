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
  AreaChart,
  Area,
} from "recharts";
import {
  Brain,
  Activity,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Target,
  BarChart3,
  Eye,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const modelAccuracyHistory = [
  { date: "Jan", random_forest: 0.92, xgboost: 0.94, lstm: 0.89, ensemble: 0.95 },
  { date: "Feb", random_forest: 0.91, xgboost: 0.93, lstm: 0.88, ensemble: 0.94 },
  { date: "Mar", random_forest: 0.90, xgboost: 0.92, lstm: 0.87, ensemble: 0.93 },
  { date: "Apr", random_forest: 0.89, xgboost: 0.91, lstm: 0.86, ensemble: 0.92 },
  { date: "May", random_forest: 0.88, xgboost: 0.90, lstm: 0.85, ensemble: 0.91 },
  { date: "Jun", random_forest: 0.87, xgboost: 0.89, lstm: 0.84, ensemble: 0.90 },
  { date: "Jul", random_forest: 0.86, xgboost: 0.88, lstm: 0.83, ensemble: 0.89 },
  { date: "Aug", random_forest: 0.85, xgboost: 0.87, lstm: 0.82, ensemble: 0.88 },
  { date: "Sep", random_forest: 0.84, xgboost: 0.86, lstm: 0.81, ensemble: 0.87 },
  { date: "Oct", random_forest: 0.83, xgboost: 0.85, lstm: 0.80, ensemble: 0.86 },
  { date: "Nov", random_forest: 0.82, xgboost: 0.84, lstm: 0.79, ensemble: 0.85 },
  { date: "Dec", random_forest: 0.81, xgboost: 0.83, lstm: 0.78, ensemble: 0.84 },
];

const featureImportance = [
  { feature: "PM2.5", importance: 0.85 },
  { feature: "PM10", importance: 0.72 },
  { feature: "NO2", importance: 0.65 },
  { feature: "SO2", importance: 0.58 },
  { feature: "CO", importance: 0.52 },
  { feature: "O3", importance: 0.48 },
  { feature: "Temperature", importance: 0.42 },
  { feature: "Humidity", importance: 0.38 },
  { feature: "Wind Speed", importance: 0.35 },
];

const driftMetrics = [
  { model: "Random Forest", drift_score: 0.23, status: "warning", accuracy_drop: 0.11, days_since_train: 180 },
  { model: "XGBoost", drift_score: 0.18, status: "warning", accuracy_drop: 0.09, days_since_train: 180 },
  { model: "LSTM", drift_score: 0.31, status: "critical", accuracy_drop: 0.13, days_since_train: 180 },
  { model: "Ensemble", drift_score: 0.15, status: "healthy", accuracy_drop: 0.07, days_since_train: 180 },
];

const predictionErrors = [
  { date: "Week 1", mae: 12.3, rmse: 15.8 },
  { date: "Week 2", mae: 13.1, rmse: 16.5 },
  { date: "Week 3", mae: 14.2, rmse: 17.8 },
  { date: "Week 4", mae: 15.5, rmse: 19.2 },
  { date: "Week 5", mae: 16.8, rmse: 20.5 },
  { date: "Week 6", mae: 17.9, rmse: 21.8 },
  { date: "Week 7", mae: 19.2, rmse: 23.1 },
  { date: "Week 8", mae: 20.5, rmse: 24.5 },
];

const retrainRecommendations = [
  { model: "LSTM", priority: "high", reason: "Accuracy dropped below 80%", estimated_improvement: "12-15%", time: "2-3 hours" },
  { model: "Random Forest", priority: "medium", reason: "Gradual accuracy decline", estimated_improvement: "8-10%", time: "45 min" },
  { model: "XGBoost", priority: "medium", reason: "Feature distribution shift", estimated_improvement: "6-8%", time: "1 hour" },
  { model: "Ensemble", priority: "low", reason: "Minor drift, still >85%", estimated_improvement: "3-5%", time: "1.5 hours" },
];

export default function ModelPerformance() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t } = useTranslation();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "warning": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-400" />
            MLOps {t('mlops.title', 'Model Performance Monitor')}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('mlops.subtitle', 'Real-time model health, drift detection, and retraining recommendations')}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {t('mlops.refreshMetrics', 'Refresh Metrics')}
        </Button>
      </motion.div>

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {driftMetrics.map((metric, idx) => (
          <motion.div key={metric.model} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <Card className="glass-card border border-white/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{metric.model}</h3>
                  <Badge className={`text-xs border ${getStatusColor(metric.status)}`}>
                    {metric.status === "healthy" ? <CheckCircle className="w-3 h-3 mr-1" /> : metric.status === "warning" ? <AlertTriangle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                    {metric.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('mlops.driftScore', 'Drift Score')}</span>
                    <span className="text-foreground font-mono">{metric.drift_score.toFixed(2)}</span>
                  </div>
                  <Progress value={metric.drift_score * 100} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('mlops.accuracyDrop', 'Accuracy Drop')}</span>
                    <span className="text-red-400 font-mono">-{(metric.accuracy_drop * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('mlops.trainingAge', 'Training Age')}</span>
                    <span className="text-foreground font-mono">{metric.days_since_train}d</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="accuracy" className="space-y-4">
        <TabsList className="bg-gray-900 border border-white/10">
          <TabsTrigger value="accuracy" className="data-[state=active]:bg-blue-600">
            <Activity className="w-4 h-4 mr-2" />
            {t('mlops.accuracyTrends', 'Accuracy Trends')}
          </TabsTrigger>
          <TabsTrigger value="drift" className="data-[state=active]:bg-blue-600">
            <TrendingDown className="w-4 h-4 mr-2" />
            {t('mlops.driftAnalysis', 'Drift Analysis')}
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-blue-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            {t('mlops.featureImportance', 'Feature Importance')}
          </TabsTrigger>
          <TabsTrigger value="retrain" className="data-[state=active]:bg-blue-600">
            <Clock className="w-4 h-4 mr-2" />
            {t('mlops.retrainRecommendations', 'Retrain Recommendations')}
          </TabsTrigger>
        </TabsList>

        {/* Accuracy Trends */}
        <TabsContent value="accuracy">
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Model {t('mlops.accuracyOverTime', 'Accuracy Over Time')} (R² {t('mlops.score', 'Score')})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={modelAccuracyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis domain={[0.7, 1.0]} stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="random_forest" stroke="#3B82F6" strokeWidth={2} name="Random Forest" />
                  <Line type="monotone" dataKey="xgboost" stroke="#10B981" strokeWidth={2} name="XGBoost" />
                  <Line type="monotone" dataKey="lstm" stroke="#F59E0B" strokeWidth={2} name="LSTM" />
                  <Line type="monotone" dataKey="ensemble" stroke="#8B5CF6" strokeWidth={3} name="Ensemble (Best)" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <strong>{t('mlops.driftAlert', 'Drift Alert')}:</strong> {t('mlops.driftAlertDesc', 'All models show gradual accuracy decline. LSTM dropped below 80% - retraining recommended.')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drift Analysis */}
        <TabsContent value="drift">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  {t('mlops.predictionErrorTrends', 'Prediction Error Trends')} (MAE)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={predictionErrors}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="mae" stroke="#EF4444" fill="rgba(239,68,68,0.2)" name="Mean Absolute Error" />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-sm text-muted-foreground mt-4">
                  MAE increased from 12.3 to 20.5 over 8 weeks, indicating model drift.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">{t('mlops.driftMetricsSummary', 'Drift Metrics Summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {driftMetrics.map((metric) => (
                  <div key={metric.model} className="p-3 bg-gray-900/50 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-foreground">{metric.model}</h4>
                      <Badge className={`text-xs border ${getStatusColor(metric.status)}`}>{metric.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-muted-foreground">{t('mlops.psiScore', 'PSI Score')}</p><p className="text-foreground font-mono">{metric.drift_score.toFixed(3)}</p></div>
                      <div><p className="text-muted-foreground">Accuracy Drop</p><p className="text-red-400 font-mono">-{(metric.accuracy_drop * 100).toFixed(1)}%</p></div>
                      <div><p className="text-muted-foreground">{t('mlops.age', 'Age')}</p><p className="text-foreground font-mono">{metric.days_since_train}d</p></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feature Importance */}
        <TabsContent value="features">
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                {t('mlops.featureImportanceRankings', 'Feature Importance Rankings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={featureImportance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" domain={[0, 1]} stroke="rgba(255,255,255,0.5)" />
                  <YAxis dataKey="feature" type="category" stroke="rgba(255,255,255,0.5)" width={100} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                  <Bar dataKey="importance" fill="#3B82F6" name="Importance Score" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-200 mb-2">{t('mlops.topPredictor', 'Top Predictor')}</h4>
                  <p className="text-2xl font-bold text-blue-400">PM2.5</p>
                  <p className="text-xs text-muted-foreground mt-1">85% importance</p>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-200 mb-2">{t('mlops.stableFeatures', 'Stable Features')}</h4>
                  <p className="text-2xl font-bold text-green-400">6/9</p>
                  <p className="text-xs text-muted-foreground mt-1">Consistent over time</p>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <h4 className="text-sm font-semibold text-yellow-200 mb-2">{t('mlops.driftDetected', 'Drift Detected')}</h4>
                  <p className="text-2xl font-bold text-yellow-400">3</p>
                  <p className="text-xs text-muted-foreground mt-1">Distribution shift</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retrain Recommendations */}
        <TabsContent value="retrain">
          <Card className="glass-card border border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                {t('mlops.aiRetrainingRecommendations', 'AI-Powered Retraining Recommendations')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {retrainRecommendations.map((rec, idx) => (
                <motion.div key={rec.model} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-4 bg-gray-900/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Brain className="w-6 h-6 text-blue-400" />
                      <div>
                        <h4 className="text-lg font-bold text-foreground">{rec.model}</h4>
                        <p className="text-sm text-muted-foreground">{rec.reason}</p>
                      </div>
                    </div>
                    <Badge className={`border ${getPriorityColor(rec.priority)}`}>{rec.priority.toUpperCase()} PRIORITY</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <p className="text-xs text-green-200 mb-1">{t('mlops.expectedImprovement', 'Expected Improvement')}</p>
                      <p className="text-lg font-bold text-green-400">{rec.estimated_improvement}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <p className="text-xs text-blue-200 mb-1">{t('mlops.timeRequired', 'Time Required')}</p>
                      <p className="text-lg font-bold text-blue-400">{rec.time}</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <p className="text-xs text-purple-200 mb-1">{t('mlops.action', 'Action')}</p>
                      <Button size="sm" className="w-full mt-1 bg-purple-600 hover:bg-purple-700">
                        {t('mlops.startRetraining', 'Start Retraining')} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
