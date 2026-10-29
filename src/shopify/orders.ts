import type { GraphqlResponse, ShopifyClient } from "./client.js";
import { RECENT_ORDERS_QUERY } from "./queries.js";
import type { DailyUsageBySku } from "./types.js";

type RecentOrdersData = {
  orders: {
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        createdAt: string;
        lineItems: {
          edges: Array<{
            node: {
              quantity: number;
              sku: string | null;
              title: string | null;
            };
          }>;
        } | null;
      };
    }>;
    pageInfo: { hasNextPage: boolean };
  };
};

/**
 * Paginate recent orders and aggregate line-item quantities into
 * per-SKU daily totals (YYYY-MM-DD → units).
 *
 * With `read_orders` only, Shopify returns orders from the last **60 days**.
 * Older history needs `read_all_orders` (protected access) — not requested in v0.
 * For ~5k-SKU / high-volume stores, prefer bulk operations later (S3).
 */
export async function fetchDailyUsageFromOrders(
  client: ShopifyClient,
  { maxPages = 24, pageSize = 50 }: { maxPages?: number; pageSize?: number } = {},
): Promise<{
  usageBySku: DailyUsageBySku;
  ordersRead: number;
  pagesRead: number;
  truncated: boolean;
}> {
  const usageBySku: DailyUsageBySku = new Map();
  let after: string | null = null;
  let pagesRead = 0;
  let ordersRead = 0;
  let truncated = false;

  while (pagesRead < maxPages) {
    const json: GraphqlResponse<RecentOrdersData> =
      await client.graphql<RecentOrdersData>(RECENT_ORDERS_QUERY, {
        first: pageSize,
        after,
      });

    const connection = json.data?.orders;
    const edges = connection?.edges ?? [];
    ordersRead += edges.length;

    for (const { node: order } of edges) {
      const day = order.createdAt.slice(0, 10);
      for (const { node: item } of order.lineItems?.edges ?? []) {
        if (!item.sku) continue;
        let byDay = usageBySku.get(item.sku);
        if (!byDay) {
          byDay = new Map();
          usageBySku.set(item.sku, byDay);
        }
        byDay.set(day, (byDay.get(day) ?? 0) + item.quantity);
      }
    }

    pagesRead += 1;
    const hasNext = connection?.pageInfo?.hasNextPage ?? false;
    if (!hasNext) break;

    after = edges[edges.length - 1]?.cursor ?? null;
    if (!after) break;

    if (pagesRead >= maxPages && hasNext) {
      truncated = true;
    }
  }

  return { usageBySku, ordersRead, pagesRead, truncated };
}
