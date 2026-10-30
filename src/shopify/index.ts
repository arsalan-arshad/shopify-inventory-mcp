/**
 * Shopify Admin GraphQL read layer (M2).
 * Inventory levels (sum available), order → daily usage, BYOK auth.
 */

export { clearAccessTokenCache, resolveAccessToken } from "./auth.js";
export { createShopifyClient } from "./client.js";
export type { ShopifyClient } from "./client.js";
export {
  DEFAULT_API_VERSION,
  DEFAULT_HISTORY_DAYS,
  DEFAULT_MAX_INVENTORY_ITEMS,
  DEFAULT_MAX_ORDER_PAGES,
  loadShopifyConfig,
  normalizeStoreDomain,
  shopifyConfigFromParts,
} from "./config.js";
export type { ShopifyConfigParts } from "./config.js";
export {
  getRequestShopifyConfig,
  runWithShopifyConfig,
} from "./request-context.js";
export { ShopifyError, redactSecrets } from "./errors.js";
export { fetchInventorySkus, findInventoryBySku } from "./inventory.js";
export { fetchDailyUsageFromOrders } from "./orders.js";
export {
  INVENTORY_LEVELS_QUERY,
  RECENT_ORDERS_QUERY,
} from "./queries.js";
export { loadStoreSnapshot } from "./snapshot.js";
export type { StoreSnapshot } from "./snapshot.js";
export { denseDailyHistory, historyTooShort } from "./usage.js";
export type {
  DailyUsageBySku,
  DataRange,
  InventorySku,
  ShopifyConfig,
} from "./types.js";
