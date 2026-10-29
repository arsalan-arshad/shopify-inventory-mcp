/**
 * Tool input/output types and JSON Schema drafts for the four v0 tools.
 * No Shopify calls — schemas only (M1).
 */

import { z } from "zod";
import {
  DEFAULT_LEAD_TIME_DAYS,
  DEFAULT_LIST_AT_RISK_LIMIT,
  DEFAULT_SERVICE_LEVEL_Z,
} from "../forecast/defaults.js";

export const stockStatusSchema = z.enum([
  "no_recent_sales",
  "reorder_now",
  "reorder_soon",
  "healthy",
]);

export type StockStatus = z.infer<typeof stockStatusSchema>;

const dataRangeSchema = z.object({
  from: z.string().describe("ISO date of first history day used"),
  to: z.string().describe("ISO date of last history day used"),
  dayCount: z.number().int().nonnegative(),
});

const commonMetaSchema = z.object({
  generatedAt: z.string().describe("ISO timestamp when the tool result was computed"),
  dataRange: dataRangeSchema,
  historyTooShort: z
    .boolean()
    .describe("True when the history window is too short to trust the forecast"),
});

export const skuForecastRowSchema = z.object({
  sku: z.string(),
  title: z.string().optional(),
  stock: z.number(),
  dailyDemand: z.number(),
  daysOfCover: z.union([z.number(), z.literal("Infinity")]),
  stockoutDate: z.string().nullable(),
  status: stockStatusSchema,
});

export type SkuForecastRow = z.infer<typeof skuForecastRowSchema>;

/** list_at_risk_skus */
export const listAtRiskSkusInputSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(500)
    .optional()
    .default(DEFAULT_LIST_AT_RISK_LIMIT)
    .describe(`Max SKUs to return (default ${DEFAULT_LIST_AT_RISK_LIMIT})`),
  leadTimeDays: z
    .number()
    .positive()
    .optional()
    .default(DEFAULT_LEAD_TIME_DAYS)
    .describe(`Store-wide lead time in days (default ${DEFAULT_LEAD_TIME_DAYS})`),
});

export type ListAtRiskSkusInput = z.infer<typeof listAtRiskSkusInputSchema>;

export const listAtRiskSkusOutputSchema = commonMetaSchema.extend({
  skus: z.array(skuForecastRowSchema),
  note: z.string(),
});

export type ListAtRiskSkusOutput = z.infer<typeof listAtRiskSkusOutputSchema>;

/** get_sku_forecast */
export const getSkuForecastInputSchema = z.object({
  sku: z.string().min(1),
  leadTimeDays: z.number().positive().optional().default(DEFAULT_LEAD_TIME_DAYS),
});

export type GetSkuForecastInput = z.infer<typeof getSkuForecastInputSchema>;

export const getSkuForecastOutputSchema = commonMetaSchema.extend({
  forecast: skuForecastRowSchema,
  historyWindowDays: z.number().int().positive(),
  note: z.string(),
});

export type GetSkuForecastOutput = z.infer<typeof getSkuForecastOutputSchema>;

/** get_reorder_suggestion */
export const getReorderSuggestionInputSchema = z.object({
  sku: z.string().min(1),
  leadTimeDays: z.number().positive().optional().default(DEFAULT_LEAD_TIME_DAYS),
  serviceLevelZ: z
    .number()
    .positive()
    .optional()
    .default(DEFAULT_SERVICE_LEVEL_Z),
});

export type GetReorderSuggestionInput = z.infer<
  typeof getReorderSuggestionInputSchema
>;

export const getReorderSuggestionOutputSchema = commonMetaSchema.extend({
  sku: z.string(),
  reorderPoint: z.number(),
  safetyStock: z.number(),
  avgDailyUsage: z.number(),
  belowReorderPoint: z.boolean(),
  note: z.string(),
});

export type GetReorderSuggestionOutput = z.infer<
  typeof getReorderSuggestionOutputSchema
>;

/** explain_forecast_inputs */
export const explainForecastInputsInputSchema = z.object({
  sku: z.string().min(1),
});

export type ExplainForecastInputsInput = z.infer<
  typeof explainForecastInputsInputSchema
>;

export const explainForecastInputsOutputSchema = commonMetaSchema.extend({
  sku: z.string(),
  formulas: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
  wmaWindowDays: z.number().int().positive(),
  reorderPointWmaWindowDays: z.number().int().positive(),
  serviceLevelZ: z.number(),
  leadTimeDays: z.number(),
  caveats: z.array(z.string()),
  note: z.string(),
});

export type ExplainForecastInputsOutput = z.infer<
  typeof explainForecastInputsOutputSchema
>;

/** JSON Schema objects for MCP tool registration (draft, no live wiring in M1). */
export const toolJsonSchemas = {
  list_at_risk_skus: {
    name: "list_at_risk_skus",
    description:
      "List SKUs whose days of cover is at or below lead time (status reorder_now), sorted by urgency.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: `Max SKUs to return (default ${DEFAULT_LIST_AT_RISK_LIMIT})`,
        },
        leadTimeDays: {
          type: "number",
          description: `Store-wide lead time in days (default ${DEFAULT_LEAD_TIME_DAYS})`,
        },
      },
      additionalProperties: false,
    },
  },
  get_sku_forecast: {
    name: "get_sku_forecast",
    description:
      "Daily demand, days of cover, projected stockout date, and status for one SKU.",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", description: "SKU identifier" },
        leadTimeDays: {
          type: "number",
          description: `Lead time in days (default ${DEFAULT_LEAD_TIME_DAYS})`,
        },
      },
      required: ["sku"],
      additionalProperties: false,
    },
  },
  get_reorder_suggestion: {
    name: "get_reorder_suggestion",
    description:
      "Reorder point and safety stock for a SKU given lead time and service level.",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", description: "SKU identifier" },
        leadTimeDays: {
          type: "number",
          description: `Lead time in days (default ${DEFAULT_LEAD_TIME_DAYS})`,
        },
        serviceLevelZ: {
          type: "number",
          description: `Service-level z-score (default ${DEFAULT_SERVICE_LEVEL_Z} ≈ 95%)`,
        },
      },
      required: ["sku"],
      additionalProperties: false,
    },
  },
  explain_forecast_inputs: {
    name: "explain_forecast_inputs",
    description:
      "Exact history window, formula names, and caveats used for a SKU forecast (auditable).",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", description: "SKU identifier" },
      },
      required: ["sku"],
      additionalProperties: false,
    },
  },
} as const;
