import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CrossFilterProvider } from "./contexts/CrossFilterContext";
import { LanguageProvider } from "./i18n/provider";
import AQIDashboardLayout from "./components/AQIDashboardLayout";

import Home from "./pages/Home";
import CityDetail from "./pages/CityDetail";
import MapView from "./pages/MapView";
import Rankings from "./pages/Rankings";
import Forecast from "./pages/Forecast";
import Comparison from "./pages/Comparison";
import Analytics from "./pages/Analytics";
import MLPredictions from "./pages/MLPredictions";
import DataScienceDashboard from "./pages/DataScienceDashboard";
import PowerBIAdvancedDashboard from "./pages/PowerBIAdvancedDashboard";
import HealthAdvisory from "./pages/HealthAdvisory";
import APISettings from "./pages/APISettings";
import Reports from "./pages/Reports";
import About from "./pages/About";
import ModelPerformance from "./pages/ModelPerformance";
import WhatIfSimulator from "./pages/WhatIfSimulator";
import EnsembleOptimizer from "./pages/EnsembleOptimizer";

function Router() {
  return (
    <AQIDashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/city/:id" component={CityDetail} />
        <Route path="/map" component={MapView} />
        <Route path="/rankings" component={Rankings} />
        <Route path="/forecast" component={Forecast} />
        <Route path="/comparison" component={Comparison} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/ml-predictions" component={MLPredictions} />
        <Route path="/data-science" component={DataScienceDashboard} />
        <Route path="/powerbi-dashboard" component={PowerBIAdvancedDashboard} />
        <Route path="/health" component={HealthAdvisory} />
        <Route path="/settings" component={APISettings} />
        <Route path="/reports" component={Reports} />
        <Route path="/about" component={About} />
        {/* Optional experimental routes - safe to remove */}
        <Route path="/model-performance" component={ModelPerformance} />
        <Route path="/what-if-simulator" component={WhatIfSimulator} />
        <Route path="/ensemble-optimizer" component={EnsembleOptimizer} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AQIDashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider defaultLanguage="en">
          <CrossFilterProvider>
            <TooltipProvider>
              <Toaster theme="dark" position="top-right" />
              <Router />
            </TooltipProvider>
          </CrossFilterProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
