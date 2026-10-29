import type { ShopifyClient } from "./client.js";
import { createShopifyClient } from "./client.js";
import { loadShopifyConfig } from "./config.js";
import { fetchInventorySkus } from "./inventory.js";
import { fetchDailyUsageFromOrders } from "./orders.js";
import type {
  DailyUsageBySku,
  InventorySku,
  ShopifyConfig,
} from "./types.js";

export type StoreSnapshot = {
  config: ShopifyConfig;
  inventory: InventorySku[];
  usageBySku: DailyUsageBySku;
  ordersRead: number;
  orderPagesRead: number;
  ordersTruncated: boolean;
  generatedAt: string;
};

/**
 * Load inventory + order usage for forecasting.
 * In-memory only — no persistence (v0).
 */
export async function loadStoreSnapshot(
  options: {
    config?: ShopifyConfig;
    client?: ShopifyClient;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<StoreSnapshot> {
  const config = options.config ?? loadShopifyConfig();
  const client =
    options.client ?? createShopifyClient(config, options.fetchImpl ?? fetch);

  const [inventory, orders] = await Promise.all([
    fetchInventorySkus(client, { maxItems: config.maxInventoryItems }),
    fetchDailyUsageFromOrders(client, {
      maxPages: config.maxOrderPages,
    }),
  ]);

  return {
    config,
    inventory,
    usageBySku: orders.usageBySku,
    ordersRead: orders.ordersRead,
    orderPagesRead: orders.pagesRead,
    ordersTruncated: orders.truncated,
    generatedAt: new Date().toISOString(),
  };
}
