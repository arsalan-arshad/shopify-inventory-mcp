/**
 * Fixtures derived from README §3 worked example and edge cases.
 *
 * README example:
 *   stock 150 · demand 8/day (WMA) · lead time 21 · z = 1.65 · daily stdDev 3
 *   → days of cover 18.75 · at risk · safety ≈ 22.7 · reorder ≈ 190.7
 *
 * History construction: last 14 days constant 8 (so reorder-point WMA = 8);
 * earlier days carry the population stdDev ≈ 3 while keeping overall mean 8.
 * See forecasting.js: stdDev uses full-history population variance (/ n).
 */

import { DEFAULT_LEAD_TIME_DAYS, DEFAULT_SERVICE_LEVEL_Z } from "../../src/forecast/defaults.js";

const a = Math.sqrt(18); // first-half deviation so full-history variance = 9

/** 14 varied days (mean 8) + 14 constant-8 days → WMA(14)=8, stdDev=3 */
export const readmeDailyUsageHistory: number[] = [
  ...Array.from({ length: 7 }, () => 8 - a),
  ...Array.from({ length: 7 }, () => 8 + a),
  ...Array.from({ length: 14 }, () => 8),
];

export const readmeExample = {
  sku: "X",
  currentStock: 150,
  avgDailyUsage: 8,
  leadTimeDays: DEFAULT_LEAD_TIME_DAYS,
  serviceLevelZ: DEFAULT_SERVICE_LEVEL_Z,
  /** Expected days of cover: 150 / 8 */
  expectedDaysOfCover: 18.75,
  /**
   * README "at risk" ≡ classifyStockStatus → reorder_now
   * (daysOfCover <= leadTimeDays).
   */
  expectedStatus: "reorder_now" as const,
  /**
   * Exact rounded values from forecasting.js math with crafted history
   * (README cites ≈ 22.7 / ≈ 190.7).
   */
  expectedSafetyStock: 22.68,
  expectedReorderPoint: 190.68,
  expectedAvgDailyUsage: 8,
} as const;

export const emptyHistory: number[] = [];

export const zeroDemandHistory: number[] = Array.from({ length: 14 }, () => 0);

export const zeroStock = {
  currentStock: 0,
  avgDailyUsage: 8,
  expectedDaysOfCover: 0,
} as const;
