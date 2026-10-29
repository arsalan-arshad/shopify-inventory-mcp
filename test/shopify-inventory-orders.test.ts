import { describe, expect, it, vi } from "vitest";
import { createShopifyClient } from "../src/shopify/client.js";
import { clearAccessTokenCache } from "../src/shopify/auth.js";
import { fetchInventorySkus } from "../src/shopify/inventory.js";
import { fetchDailyUsageFromOrders } from "../src/shopify/orders.js";
import type { ShopifyConfig } from "../src/shopify/types.js";
import {
  handleGetSkuForecast,
  handleListAtRiskSkus,
} from "../src/tools/handlers.js";
import type { StoreSnapshot } from "../src/shopify/snapshot.js";

const baseConfig: ShopifyConfig = {
  storeDomain: "acme.myshopify.com",
  accessToken: "shpat_test",
  apiVersion: "2025-10",
  leadTimeDays: 21,
  historyDays: 7,
  maxInventoryItems: 100,
  maxOrderPages: 2,
};

function mockGraphqlFetch(handler: (body: { query: string }) => unknown) {
  return vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as { query: string };
    const payload = handler(body);
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

describe("fetchInventorySkus", () => {
  it("sums available across locations and skips blank SKUs", async () => {
    clearAccessTokenCache();
    const fetchImpl = mockGraphqlFetch(() => ({
      data: {
        inventoryItems: {
          edges: [
            {
              cursor: "c1",
              node: {
                id: "gid://shopify/InventoryItem/1",
                sku: "X",
                variant: { displayName: "Widget X" },
                inventoryLevels: {
                  edges: [
                    {
                      node: {
                        location: { id: "L1", name: "WH" },
                        quantities: [{ name: "available", quantity: 100 }],
                      },
                    },
                    {
                      node: {
                        location: { id: "L2", name: "Store" },
                        quantities: [{ name: "available", quantity: 50 }],
                      },
                    },
                  ],
                },
              },
            },
            {
              cursor: "c2",
              node: {
                id: "gid://shopify/InventoryItem/2",
                sku: null,
                variant: { displayName: "No SKU" },
                inventoryLevels: { edges: [] },
              },
            },
          ],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    }));

    const client = createShopifyClient(baseConfig, fetchImpl);
    const items = await fetchInventorySkus(client, { maxItems: 50 });
    expect(items).toHaveLength(1);
    expect(items[0]!.sku).toBe("X");
    expect(items[0]!.available).toBe(150);
  });
});

describe("fetchDailyUsageFromOrders", () => {
  it("aggregates line items by SKU and day", async () => {
    clearAccessTokenCache();
    const fetchImpl = mockGraphqlFetch(() => ({
      data: {
        orders: {
          edges: [
            {
              cursor: "o1",
              node: {
                id: "gid://shopify/Order/1",
                createdAt: "2026-10-20T12:00:00Z",
                lineItems: {
                  edges: [
                    { node: { quantity: 2, sku: "X", title: "Widget" } },
                    { node: { quantity: 1, sku: "X", title: "Widget" } },
                  ],
                },
              },
            },
          ],
          pageInfo: { hasNextPage: false },
        },
      },
    }));

    const client = createShopifyClient(baseConfig, fetchImpl);
    const { usageBySku, ordersRead } = await fetchDailyUsageFromOrders(client, {
      maxPages: 1,
    });
    expect(ordersRead).toBe(1);
    expect(usageBySku.get("X")?.get("2026-10-20")).toBe(3);
  });
});

describe("tool handlers with in-memory snapshot", () => {
  const now = new Date(Date.UTC(2026, 9, 28));
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  // Constant 8/day demand for SKU X; cover 150/8 = 18.75 ≤ 21 → at risk
  const byDay = new Map(days.map((d) => [d, 8]));

  const snapshot: StoreSnapshot = {
    config: baseConfig,
    inventory: [
      {
        inventoryItemId: "1",
        sku: "X",
        title: "Widget X",
        available: 150,
        locations: [],
      },
      {
        inventoryItemId: "2",
        sku: "Y",
        title: "Healthy Y",
        available: 10_000,
        locations: [],
      },
    ],
    usageBySku: new Map([
      ["X", byDay],
      ["Y", byDay],
    ]),
    ordersRead: 10,
    orderPagesRead: 1,
    ordersTruncated: false,
    generatedAt: now.toISOString(),
  };

  it("lists only reorder_now SKUs", () => {
    const result = handleListAtRiskSkus(snapshot, { leadTimeDays: 21 });
    expect(result.skus.map((s) => s.sku)).toEqual(["X"]);
    expect(result.skus[0]!.status).toBe("reorder_now");
    expect(result.skus[0]!.daysOfCover).toBe(18.75);
  });

  it("returns per-SKU forecast", () => {
    const result = handleGetSkuForecast(snapshot, { sku: "X" });
    expect(result.forecast.dailyDemand).toBe(8);
    expect(result.forecast.stock).toBe(150);
  });
});
