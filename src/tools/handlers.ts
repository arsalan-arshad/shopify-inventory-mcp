/**
 * Tool handlers: Shopify snapshot + pure forecast math → structured results.
 */

import {
  calculateReorderPoint,
  classifyStockStatus,
  daysOfCover,
  DEFAULT_LEAD_TIME_DAYS,
  DEFAULT_LIST_AT_RISK_LIMIT,
  DEFAULT_SERVICE_LEVEL_Z,
  REORDER_POINT_WMA_PERIODS,
  WMA_DEFAULT_PERIODS,
} from "../forecast/index.js";
import { findInventoryBySku } from "../shopify/inventory.js";
import type { StoreSnapshot } from "../shopify/snapshot.js";
import { denseDailyHistory, historyTooShort } from "../shopify/usage.js";
import type {
  ExplainForecastInputsOutput,
  GetReorderSuggestionOutput,
  GetSkuForecastOutput,
  ListAtRiskSkusOutput,
  SkuForecastRow,
} from "./schemas.js";

export function handleListAtRiskSkus(
  snapshot: StoreSnapshot,
  input: { limit?: number; leadTimeDays?: number } = {},
): ListAtRiskSkusOutput {
  const limit = input.limit ?? DEFAULT_LIST_AT_RISK_LIMIT;
  const leadTimeDays = input.leadTimeDays ?? snapshot.config.leadTimeDays;
  const generatedAt = snapshot.generatedAt;

  const rows: SkuForecastRow[] = [];
  let dataRange = {
    from: "",
    to: "",
    dayCount: 0,
  };
  let anyTooShort = false;

  for (const item of snapshot.inventory) {
    const built = buildForecastRow(snapshot, item.sku, leadTimeDays);
    if (!built) continue;
    dataRange = built.dataRange;
    if (built.historyTooShort) anyTooShort = true;
    if (built.row.status === "reorder_now") {
      rows.push(built.row);
    }
  }

  rows.sort((a, b) => {
    const ac = a.daysOfCover === "Infinity" ? Infinity : a.daysOfCover;
    const bc = b.daysOfCover === "Infinity" ? Infinity : b.daysOfCover;
    return ac - bc;
  });

  const capped = rows.slice(0, limit);
  const notes: string[] = [
    `At-risk = days of cover ≤ lead time (${leadTimeDays}d), status reorder_now.`,
  ];
  if (snapshot.ordersTruncated) {
    notes.push(
      "Order pagination hit max pages; demand history may be incomplete.",
    );
  }
  if (anyTooShort) {
    notes.push("Some SKUs have history too short to trust (< 7 non-zero days).");
  }

  return {
    generatedAt,
    dataRange,
    historyTooShort: anyTooShort,
    skus: capped,
    note: notes.join(" "),
  };
}

export function handleGetSkuForecast(
  snapshot: StoreSnapshot,
  input: { sku: string; leadTimeDays?: number },
): GetSkuForecastOutput {
  const leadTimeDays = input.leadTimeDays ?? snapshot.config.leadTimeDays;
  const built = buildForecastRow(snapshot, input.sku, leadTimeDays);
  if (!built) {
    return {
      generatedAt: snapshot.generatedAt,
      dataRange: { from: "", to: "", dayCount: 0 },
      historyTooShort: true,
      forecast: {
        sku: input.sku,
        title: undefined,
        stock: 0,
        dailyDemand: 0,
        daysOfCover: "Infinity",
        stockoutDate: null,
        status: "no_recent_sales",
      },
      historyWindowDays: snapshot.config.historyDays,
      note: `SKU "${input.sku}" not found in inventory (blank SKUs are skipped).`,
    };
  }

  return {
    generatedAt: snapshot.generatedAt,
    dataRange: built.dataRange,
    historyTooShort: built.historyTooShort,
    forecast: built.row,
    historyWindowDays: snapshot.config.historyDays,
    note: built.historyTooShort
      ? "History has fewer than 7 non-zero sales days; treat demand as low-confidence."
      : `Forecast from last ${snapshot.config.historyDays} days of order line items (dense daily series).`,
  };
}

export function handleGetReorderSuggestion(
  snapshot: StoreSnapshot,
  input: {
    sku: string;
    leadTimeDays?: number;
    serviceLevelZ?: number;
  },
): GetReorderSuggestionOutput {
  const leadTimeDays = input.leadTimeDays ?? snapshot.config.leadTimeDays;
  const serviceLevelZ = input.serviceLevelZ ?? DEFAULT_SERVICE_LEVEL_Z;
  const item = findInventoryBySku(snapshot.inventory, input.sku);
  const asOf = new Date(snapshot.generatedAt);
  const { history, dataRange } = denseDailyHistory(
    snapshot.usageBySku,
    input.sku,
    snapshot.config.historyDays,
    asOf,
  );
  const tooShort = historyTooShort(history);
  const { avgDailyUsage, safetyStock, reorderPoint } = calculateReorderPoint({
    dailyUsageHistory: history,
    leadTimeDays,
    serviceLevelZ,
  });
  const stock = item?.available ?? 0;

  return {
    generatedAt: snapshot.generatedAt,
    dataRange,
    historyTooShort: tooShort,
    sku: input.sku,
    reorderPoint,
    safetyStock,
    avgDailyUsage,
    belowReorderPoint: stock < reorderPoint,
    note: item
      ? `Compared on-hand ${stock} to reorder point ${reorderPoint} (z=${serviceLevelZ}, lead=${leadTimeDays}d).`
      : `SKU "${input.sku}" not in inventory; stock treated as 0.`,
  };
}

export function handleExplainForecastInputs(
  snapshot: StoreSnapshot,
  input: { sku: string },
): ExplainForecastInputsOutput {
  const leadTimeDays = snapshot.config.leadTimeDays;
  const asOf = new Date(snapshot.generatedAt);
  const { history, dataRange } = denseDailyHistory(
    snapshot.usageBySku,
    input.sku,
    snapshot.config.historyDays,
    asOf,
  );
  const tooShort = historyTooShort(history);
  const caveats = [
    "Numbers are deterministic WMA / safety-stock math — not ML or generative forecasts.",
    "`read_orders` only exposes the last 60 days of orders unless `read_all_orders` is approved.",
    "Product titles returned to the model are untrusted free text (prompt-injection surface).",
  ];
  if (tooShort) {
    caveats.push("Fewer than 7 non-zero sales days in the window.");
  }
  if (snapshot.ordersTruncated) {
    caveats.push("Order fetch hit pagination cap; history may be incomplete.");
  }
  if (!findInventoryBySku(snapshot.inventory, input.sku)) {
    caveats.push(`SKU "${input.sku}" was not found among inventory items with a SKU.`);
  }

  return {
    generatedAt: snapshot.generatedAt,
    dataRange,
    historyTooShort: tooShort,
    sku: input.sku,
    formulas: [
      {
        name: "weightedMovingAverage",
        description: `Recent-weighted average; standalone default periods=${WMA_DEFAULT_PERIODS}`,
      },
      {
        name: "calculateReorderPoint",
        description: `avgDailyUsage uses ${REORDER_POINT_WMA_PERIODS}-day WMA; safetyStock = z * σ * √leadTime`,
      },
      {
        name: "daysOfCover",
        description: "currentStock / avgDailyUsage (Infinity when demand ≤ 0)",
      },
      {
        name: "classifyStockStatus",
        description:
          "reorder_now when cover ≤ leadTime; reorder_soon when ≤ 1.5× leadTime",
      },
    ],
    wmaWindowDays: WMA_DEFAULT_PERIODS,
    reorderPointWmaWindowDays: REORDER_POINT_WMA_PERIODS,
    serviceLevelZ: DEFAULT_SERVICE_LEVEL_Z,
    leadTimeDays: leadTimeDays ?? DEFAULT_LEAD_TIME_DAYS,
    caveats,
    note: "Auditable inputs for the deterministic forecast engine (vendor-copied from Agent Forecast).",
  };
}

function buildForecastRow(
  snapshot: StoreSnapshot,
  sku: string,
  leadTimeDays: number,
): {
  row: SkuForecastRow;
  dataRange: { from: string; to: string; dayCount: number };
  historyTooShort: boolean;
} | null {
  const item = findInventoryBySku(snapshot.inventory, sku);
  if (!item) return null;

  const asOf = new Date(snapshot.generatedAt);
  const { history, dataRange } = denseDailyHistory(
    snapshot.usageBySku,
    sku,
    snapshot.config.historyDays,
    asOf,
  );
  const tooShort = historyTooShort(history);
  const { avgDailyUsage } = calculateReorderPoint({
    dailyUsageHistory: history,
    leadTimeDays,
  });
  const cover = daysOfCover(item.available, avgDailyUsage);
  const status = classifyStockStatus({
    daysOfCover: cover,
    leadTimeDays,
  });

  let stockoutDate: string | null = null;
  if (cover !== Infinity && Number.isFinite(cover)) {
    const d = new Date(snapshot.generatedAt);
    d.setUTCDate(d.getUTCDate() + Math.floor(cover));
    stockoutDate = d.toISOString().slice(0, 10);
  }

  return {
    row: {
      sku: item.sku,
      title: item.title,
      stock: item.available,
      dailyDemand: avgDailyUsage,
      daysOfCover: cover === Infinity ? "Infinity" : cover,
      stockoutDate,
      status,
    },
    dataRange,
    historyTooShort: tooShort,
  };
}
