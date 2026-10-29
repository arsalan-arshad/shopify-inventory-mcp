/**
 * Pure inventory-forecast math.
 *
 * Vendor-copied / ported from:
 *   ../shopify-ai-forecast-app/app/lib/forecasting.js
 * Keep fixture tests in sync with that source when either side changes.
 * Do not modify the live Agent Forecast app unless the owner asks.
 */

import {
  DEFAULT_SERVICE_LEVEL_Z,
  REORDER_POINT_WMA_PERIODS,
  WMA_DEFAULT_PERIODS,
} from "./defaults.js";

export {
  DEFAULT_LEAD_TIME_DAYS,
  DEFAULT_LIST_AT_RISK_LIMIT,
  DEFAULT_SERVICE_LEVEL_Z,
  MULTI_LOCATION_STOCK_POLICY,
  REORDER_POINT_WMA_PERIODS,
  WMA_DEFAULT_PERIODS,
} from "./defaults.js";

export type StockStatus =
  | "no_recent_sales"
  | "reorder_now"
  | "reorder_soon"
  | "healthy";

export type ReorderPointResult = {
  avgDailyUsage: number;
  safetyStock: number;
  reorderPoint: number;
};

/**
 * Weighted moving average, recent periods weighted more heavily.
 * @param history - daily/weekly unit sales, oldest first
 * @param periods - how many recent periods to weight (default 4, matching forecasting.js)
 */
export function weightedMovingAverage(
  history: number[],
  periods: number = WMA_DEFAULT_PERIODS,
): number {
  const recent = history.slice(-periods);
  if (recent.length === 0) return 0;

  const weights = recent.map((_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const weighted = recent.reduce(
    (sum, value, i) => sum + value * weights[i]!,
    0,
  );

  return weighted / weightSum;
}

/**
 * Reorder point = (avg daily usage * lead time in days) + safety stock.
 * Safety stock uses a population std-dev buffer scaled by service-level z
 * (1.65 ≈ ~95% service level). Avg daily usage uses a 14-period WMA
 * (REORDER_POINT_WMA_PERIODS), not the standalone WMA default of 4.
 */
export function calculateReorderPoint({
  dailyUsageHistory,
  leadTimeDays,
  serviceLevelZ = DEFAULT_SERVICE_LEVEL_Z,
}: {
  dailyUsageHistory: number[];
  leadTimeDays: number;
  serviceLevelZ?: number;
}): ReorderPointResult {
  const avgDailyUsage = weightedMovingAverage(
    dailyUsageHistory,
    REORDER_POINT_WMA_PERIODS,
  );

  const hasHistory = dailyUsageHistory.length > 0;
  const mean = hasHistory
    ? dailyUsageHistory.reduce((a, b) => a + b, 0) / dailyUsageHistory.length
    : 0;
  const variance = hasHistory
    ? dailyUsageHistory.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
      dailyUsageHistory.length
    : 0;
  const stdDev = Math.sqrt(variance);

  const safetyStock = serviceLevelZ * stdDev * Math.sqrt(leadTimeDays);
  const reorderPoint = avgDailyUsage * leadTimeDays + safetyStock;

  return {
    avgDailyUsage: round2(avgDailyUsage),
    safetyStock: round2(safetyStock),
    reorderPoint: round2(reorderPoint),
  };
}

/**
 * Days-of-cover: how many days until a SKU stocks out at current velocity.
 * Returns Infinity when avgDailyUsage <= 0 (no demand / no sales).
 */
export function daysOfCover(currentStock: number, avgDailyUsage: number): number {
  if (avgDailyUsage <= 0) return Infinity;
  return round2(currentStock / avgDailyUsage);
}

/**
 * Flags a SKU based on days-of-cover vs lead time.
 *
 * README "at risk" = days of cover below lead time. That maps to
 * `reorder_now` here (`daysOfCover <= leadTimeDays`). `reorder_soon`
 * (up to 1.5× lead time) is a softer warning, not the list_at_risk cut.
 */
export function classifyStockStatus({
  daysOfCover: cover,
  leadTimeDays,
}: {
  daysOfCover: number;
  leadTimeDays: number;
}): StockStatus {
  if (cover === Infinity) return "no_recent_sales";
  if (cover <= leadTimeDays) return "reorder_now";
  if (cover <= leadTimeDays * 1.5) return "reorder_soon";
  return "healthy";
}

/** Rounding policy: two decimal places (half away from zero via Math.round). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
