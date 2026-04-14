import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../_core/logger";

const DATA_DIR = path.join(process.cwd(), "server/data");

function loadMLMetrics(): any {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, "ml_metrics.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function loadForecasts(): any[] {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, "forecasts.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getAQICategory(aqi: number) {
  if (aqi <= 50) return { category: "Good", color: "#22C55E" };
  if (aqi <= 100) return { category: "Moderate", color: "#EAB308" };
  if (aqi <= 200) return { category: "Poor", color: "#F97316" };
  if (aqi <= 300) return { category: "Very Poor", color: "#EF4444" };
  return { category: "Severe", color: "#8B0000" };
}

export const mlServiceRouter = router({
  predict: publicProcedure
    .input(z.object({
      cityId: z.string(),
      model: z.enum(["random_forest", "lstm", "xgboost", "prophet", "ensemble"]).optional().default("ensemble"),
      horizon: z.number().optional().default(7),
    }))
    .query(({ input }) => {
      try {
        logger.debug('ML Service: Prediction request', {
          cityId: input.cityId,
          model: input.model,
          horizon: input.horizon,
        });

        const forecasts = loadForecasts().filter((f: any) => f.city_id === input.cityId);
        const metrics = loadMLMetrics();
        const modelMetrics = metrics[input.model] || metrics.ensemble;

        if (forecasts.length === 0) {
          logger.warn('ML Service: No forecasts found', { cityId: input.cityId });
          return {
            predictions: [],
            model: input.model,
            metrics: modelMetrics,
            message: "No forecast data available",
          };
        }

        const predictions = forecasts.slice(0, input.horizon).map((pred: any) => {
          const { category, color } = getAQICategory(pred.predicted_aqi);
          return {
            ...pred,
            category,
            color,
          };
        });

        logger.info('ML Service: Prediction successful', {
          cityId: input.cityId,
          predictionsCount: predictions.length,
        });

        return {
          predictions,
          model: input.model,
          metrics: modelMetrics,
          feature_count: 60,
          training_period: "2020-2024",
          validation_method: "TimeSeriesSplit (5-fold)",
          model_version: "1.0.0",
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        logger.error('ML Service: Prediction failed', {
          cityId: input.cityId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw new Error(`ML prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * Get model performance metrics
   */
  getMetrics: publicProcedure.query(() => {
    try {
      const metrics = loadMLMetrics();
      
      return {
        models: Object.entries(metrics).map(([name, m]: [string, any]) => ({
          name,
          display_name: {
            random_forest: "Random Forest",
            lstm: "LSTM Neural Network",
            xgboost: "XGBoost",
            prophet: "Prophet (Time-Series)",
            ensemble: "Ensemble Stacking",
          }[name] || name,
          ...m,
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('ML Service: Failed to load metrics', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { models: [], timestamp: new Date().toISOString() };
    }
  }),

  /**
   * Get model health status
   */
  getHealth: publicProcedure.query(() => {
    const metrics = loadMLMetrics();
    
    return {
      status: "healthy",
      models_loaded: Object.keys(metrics).length,
      models: Object.entries(metrics).map(([name, m]: [string, any]) => ({
        name,
        r2: m.r2 || 0,
        health: m.r2 > 0.85 ? "good" : m.r2 > 0.70 ? "warning" : "critical",
      })),
      timestamp: new Date().toISOString(),
    };
  }),
});

export type MLServiceRouter = typeof mlServiceRouter;
