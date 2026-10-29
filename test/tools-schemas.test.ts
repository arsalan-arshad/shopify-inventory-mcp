import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEAD_TIME_DAYS,
  DEFAULT_LIST_AT_RISK_LIMIT,
  DEFAULT_SERVICE_LEVEL_Z,
} from "../src/forecast/defaults.js";
import {
  explainForecastInputsInputSchema,
  getReorderSuggestionInputSchema,
  getSkuForecastInputSchema,
  listAtRiskSkusInputSchema,
  toolJsonSchemas,
} from "../src/tools/schemas.js";

describe("tool schemas", () => {
  it("registers all four planned tools", () => {
    expect(Object.keys(toolJsonSchemas).sort()).toEqual([
      "explain_forecast_inputs",
      "get_reorder_suggestion",
      "get_sku_forecast",
      "list_at_risk_skus",
    ]);
  });

  it("list_at_risk_skus defaults limit=50 and leadTimeDays=21", () => {
    const parsed = listAtRiskSkusInputSchema.parse({});
    expect(parsed.limit).toBe(DEFAULT_LIST_AT_RISK_LIMIT);
    expect(parsed.leadTimeDays).toBe(DEFAULT_LEAD_TIME_DAYS);
    expect(DEFAULT_LIST_AT_RISK_LIMIT).toBe(50);
  });

  it("get_sku_forecast requires sku", () => {
    expect(() => getSkuForecastInputSchema.parse({})).toThrow();
    expect(getSkuForecastInputSchema.parse({ sku: "X" }).leadTimeDays).toBe(
      DEFAULT_LEAD_TIME_DAYS,
    );
  });

  it("get_reorder_suggestion defaults z=1.65", () => {
    const parsed = getReorderSuggestionInputSchema.parse({ sku: "X" });
    expect(parsed.serviceLevelZ).toBe(DEFAULT_SERVICE_LEVEL_Z);
  });

  it("explain_forecast_inputs requires sku", () => {
    expect(explainForecastInputsInputSchema.parse({ sku: "X" }).sku).toBe("X");
  });
});
