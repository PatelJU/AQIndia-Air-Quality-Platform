import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("AQIndia API Tests", () => {
  describe("cities router", () => {
    it("should return all cities", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.cities.all();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return a city by id", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.cities.byId({ id: "delhi" });
      expect(result).toBeDefined();
      expect(result?.id).toBe("delhi");
      expect(result?.name).toBe("Delhi");
    });

    it("should return cities by region", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.cities.byRegion({ region: "North" });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((city: any) => {
        expect(city.region).toBe("North");
      });
    });
  });

  describe("aqi router", () => {
    it("should return all AQI data with 108 cities", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.aqi.all();
      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThanOrEqual(100);
      expect(result.source_info).toBeDefined();
    });

    it("should return national AQI statistics", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.aqi.national();
      expect(result.national_avg).toBeGreaterThan(0);
      expect(result.national_avg).toBeLessThanOrEqual(500);
      expect(result.best_city).toBeDefined();
      expect(result.worst_city).toBeDefined();
    });

    it("should return AQI rankings", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.aqi.rankings({ order: "desc", limit: 10, region: undefined, category: undefined });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
      // Verify descending order
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].aqi).toBeGreaterThanOrEqual(result[i].aqi);
      }
    });
  });

  describe("historical router", () => {
    it("should return historical city data", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.historical.city({ cityId: "delhi", days: 30 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const record = result[0];
      expect(record).toHaveProperty("date");
      expect(record).toHaveProperty("aqi");
    });

    it("should return monthly aggregates", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.historical.cityMonthly({ cityId: "mumbai" });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("forecast router", () => {
    it("should return city forecast", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.forecast.city({ cityId: "delhi", horizon: "7d" });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const forecast = result[0];
      expect(forecast).toHaveProperty("date");
      expect(forecast).toHaveProperty("predicted_aqi");
      expect(forecast).toHaveProperty("lower_80");
      expect(forecast).toHaveProperty("upper_80");
    });
  });

  describe("analytics router", () => {
    it("should return Mann-Kendall trend analysis", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.analytics.mannKendall();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const item = result[0];
      expect(item).toHaveProperty("city_id");
      expect(item).toHaveProperty("trend");
      expect(item).toHaveProperty("sens_slope");
      expect(item).toHaveProperty("p_value");
    });

    it("should return festival impact data", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.analytics.festivalImpact({ festival: "all", cityId: undefined });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const item = result[0];
      expect(item).toHaveProperty("festival");
      expect(item).toHaveProperty("before_avg");
      expect(item).toHaveProperty("during_avg");
    });

    it("should return source apportionment data", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.analytics.sourceApportionment({ cityId: undefined });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("ml router", () => {
    it("should return ML model metrics", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.ml.metrics();
      // metrics returns an object with model names as keys
      expect(typeof result).toBe("object");
      expect(result).toHaveProperty("random_forest");
      expect(result).toHaveProperty("xgboost");
      const rf = (result as any).random_forest;
      expect(rf).toHaveProperty("rmse");
      expect(rf).toHaveProperty("r2");
    });

    it("should return SHAP values", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.ml.shap({ cityId: "delhi" });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const item = result[0];
      expect(item).toHaveProperty("feature");
      expect(item).toHaveProperty("mean_abs_shap");
    });

    it("should return feature importance", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.ml.featureImportance();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("auth router", () => {
    it("should return null user for unauthenticated request", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeNull();
    });
  });
});
