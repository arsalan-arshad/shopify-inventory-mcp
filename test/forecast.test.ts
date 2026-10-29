import { describe, expect, it } from "vitest";
import {
  calculateReorderPoint,
  classifyStockStatus,
  daysOfCover,
  round2,
  weightedMovingAverage,
} from "../src/forecast/index.js";
import {
  emptyHistory,
  readmeDailyUsageHistory,
  readmeExample,
  zeroDemandHistory,
  zeroStock,
} from "./fixtures/readme-example.js";

describe("weightedMovingAverage", () => {
  it("returns 0 for empty history", () => {
    expect(weightedMovingAverage([])).toBe(0);
  });

  it("defaults to 4-period weights matching forecasting.js", () => {
    // weights 1,2,3,4 over last 4 → (1*1+2*2+3*3+4*4)/10 = 3.0
    expect(weightedMovingAverage([1, 2, 3, 4])).toBe(3);
  });

  it("uses only the last N periods", () => {
    expect(weightedMovingAverage([100, 1, 2, 3, 4], 4)).toBe(3);
  });
});

describe("README example fixture", () => {
  it("days of cover is 18.75", () => {
    expect(
      daysOfCover(readmeExample.currentStock, readmeExample.avgDailyUsage),
    ).toBe(readmeExample.expectedDaysOfCover);
  });

  it('classifies as reorder_now ("at risk" in README)', () => {
    const cover = daysOfCover(
      readmeExample.currentStock,
      readmeExample.avgDailyUsage,
    );
    expect(
      classifyStockStatus({
        daysOfCover: cover,
        leadTimeDays: readmeExample.leadTimeDays,
      }),
    ).toBe(readmeExample.expectedStatus);
  });

  it("reorder point ≈ 190.7 and safety ≈ 22.7 with crafted history", () => {
    const result = calculateReorderPoint({
      dailyUsageHistory: readmeDailyUsageHistory,
      leadTimeDays: readmeExample.leadTimeDays,
      serviceLevelZ: readmeExample.serviceLevelZ,
    });
    expect(result.avgDailyUsage).toBe(readmeExample.expectedAvgDailyUsage);
    expect(result.safetyStock).toBe(readmeExample.expectedSafetyStock);
    expect(result.reorderPoint).toBe(readmeExample.expectedReorderPoint);
    // README approximates
    expect(result.safetyStock).toBeCloseTo(22.7, 1);
    expect(result.reorderPoint).toBeCloseTo(190.7, 1);
  });
});

describe("edge cases — defined, non-NaN", () => {
  it("empty history → zeros, not NaN", () => {
    const result = calculateReorderPoint({
      dailyUsageHistory: emptyHistory,
      leadTimeDays: 21,
    });
    expect(result.avgDailyUsage).toBe(0);
    expect(result.safetyStock).toBe(0);
    expect(result.reorderPoint).toBe(0);
    expect(Number.isNaN(result.avgDailyUsage)).toBe(false);
    expect(Number.isNaN(result.safetyStock)).toBe(false);
    expect(Number.isNaN(result.reorderPoint)).toBe(false);
  });

  it("zero demand → Infinity days of cover, no_recent_sales", () => {
    const cover = daysOfCover(150, 0);
    expect(cover).toBe(Infinity);
    expect(
      classifyStockStatus({ daysOfCover: cover, leadTimeDays: 21 }),
    ).toBe("no_recent_sales");

    const result = calculateReorderPoint({
      dailyUsageHistory: zeroDemandHistory,
      leadTimeDays: 21,
    });
    expect(result.avgDailyUsage).toBe(0);
    expect(Number.isNaN(result.reorderPoint)).toBe(false);
  });

  it("zero stock → 0 days of cover, reorder_now", () => {
    const cover = daysOfCover(zeroStock.currentStock, zeroStock.avgDailyUsage);
    expect(cover).toBe(zeroStock.expectedDaysOfCover);
    expect(
      classifyStockStatus({ daysOfCover: cover, leadTimeDays: 21 }),
    ).toBe("reorder_now");
  });
});

describe("classifyStockStatus thresholds", () => {
  it("reorder_soon when cover is between leadTime and 1.5× leadTime", () => {
    expect(
      classifyStockStatus({ daysOfCover: 25, leadTimeDays: 21 }),
    ).toBe("reorder_soon");
  });

  it("healthy when cover is above 1.5× leadTime", () => {
    expect(
      classifyStockStatus({ daysOfCover: 40, leadTimeDays: 21 }),
    ).toBe("healthy");
  });
});

describe("rounding policy", () => {
  it("round2 pins to two decimal places", () => {
    expect(round2(22.681748)).toBe(22.68);
    expect(round2(190.681748)).toBe(190.68);
    expect(round2(18.75)).toBe(18.75);
  });
});
