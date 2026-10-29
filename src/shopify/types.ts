/** Shared Shopify read-layer types (M2). */

export type ShopifyConfig = {
  storeDomain: string;
  /** Static Admin API token (legacy admin-created custom apps still work). */
  accessToken?: string;
  /** Dev Dashboard client credentials (tokens last 24h). */
  clientId?: string;
  clientSecret?: string;
  /** Admin GraphQL API version. */
  apiVersion: string;
  /** Store-wide lead time default (days). */
  leadTimeDays: number;
  /** Dense daily-usage window for forecasts (matches Agent Forecast). */
  historyDays: number;
  /** Safety cap on inventory items scanned. */
  maxInventoryItems: number;
  /** Max order pages to pull (50 orders/page). */
  maxOrderPages: number;
};

export type InventoryLocationStock = {
  id: string;
  name: string;
  available: number;
};

export type InventorySku = {
  inventoryItemId: string;
  sku: string;
  title: string;
  available: number;
  locations: InventoryLocationStock[];
};

export type DailyUsageBySku = Map<string, Map<string, number>>;

export type DataRange = {
  from: string;
  to: string;
  dayCount: number;
};
