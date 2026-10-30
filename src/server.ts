#!/usr/bin/env node
/**
 * MCP server — stdio transport, four forecast tools over BYOK Shopify data.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  DEFAULT_LEAD_TIME_DAYS,
  DEFAULT_LIST_AT_RISK_LIMIT,
  DEFAULT_SERVICE_LEVEL_Z,
} from "./forecast/defaults.js";
import { loadStoreSnapshot, type StoreSnapshot } from "./shopify/index.js";
import { getPackageMeta } from "./package-meta.js";
import {
  handleExplainForecastInputs,
  handleGetReorderSuggestion,
  handleGetSkuForecast,
  handleListAtRiskSkus,
  toolJsonSchemas,
} from "./tools/index.js";

let cachedSnapshot: { loadedAt: number; snapshot: StoreSnapshot } | null =
  null;
const SNAPSHOT_TTL_MS = 60_000;

async function getSnapshot(): Promise<StoreSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedSnapshot.loadedAt < SNAPSHOT_TTL_MS) {
    return cachedSnapshot.snapshot;
  }
  const snapshot = await loadStoreSnapshot();
  cachedSnapshot = { loadedAt: now, snapshot };
  return snapshot;
}

export function createInventoryMcpServer(): McpServer {
  const meta = getPackageMeta();
  const server = new McpServer({
    name: meta.name,
    version: meta.version,
  });

  server.tool(
    "list_at_risk_skus",
    toolJsonSchemas.list_at_risk_skus.description,
    {
      limit: z
        .number()
        .int()
        .positive()
        .max(500)
        .optional()
        .describe(`Max SKUs (default ${DEFAULT_LIST_AT_RISK_LIMIT})`),
      leadTimeDays: z
        .number()
        .positive()
        .optional()
        .describe(`Store-wide lead time days (default ${DEFAULT_LEAD_TIME_DAYS})`),
    },
    async (args) => {
      const snapshot = await getSnapshot();
      const result = handleListAtRiskSkus(snapshot, args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "get_sku_forecast",
    toolJsonSchemas.get_sku_forecast.description,
    {
      sku: z.string().min(1).describe("SKU identifier"),
      leadTimeDays: z.number().positive().optional(),
    },
    async (args) => {
      const snapshot = await getSnapshot();
      const result = handleGetSkuForecast(snapshot, args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "get_reorder_suggestion",
    toolJsonSchemas.get_reorder_suggestion.description,
    {
      sku: z.string().min(1),
      leadTimeDays: z.number().positive().optional(),
      serviceLevelZ: z
        .number()
        .positive()
        .optional()
        .describe(`Service-level z (default ${DEFAULT_SERVICE_LEVEL_Z})`),
    },
    async (args) => {
      const snapshot = await getSnapshot();
      const result = handleGetReorderSuggestion(snapshot, args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "explain_forecast_inputs",
    toolJsonSchemas.explain_forecast_inputs.description,
    {
      sku: z.string().min(1),
    },
    async (args) => {
      const snapshot = await getSnapshot();
      const result = handleExplainForecastInputs(snapshot, args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  return server;
}

export async function main(): Promise<void> {
  const server = createInventoryMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export function listPlannedTools(): string[] {
  return Object.keys(toolJsonSchemas);
}

const entryHref = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";

if (import.meta.url === entryHref) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
