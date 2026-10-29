import type { GraphqlResponse, ShopifyClient } from "./client.js";
import { INVENTORY_LEVELS_QUERY } from "./queries.js";
import type { InventorySku } from "./types.js";

type InventoryLevelsData = {
  inventoryItems: {
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        sku: string | null;
        variant: { displayName: string } | null;
        inventoryLevels: {
          edges: Array<{
            node: {
              location: { id: string; name: string } | null;
              quantities: Array<{ name: string; quantity: number }> | null;
            };
          }>;
        } | null;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

/**
 * Paginate inventory items and sum `available` across up to 10 locations
 * per item (matches Agent Forecast forecast-snapshot.server.js).
 * Items with blank SKU are skipped.
 */
export async function fetchInventorySkus(
  client: ShopifyClient,
  { maxItems = 2000 }: { maxItems?: number } = {},
): Promise<InventorySku[]> {
  const results: InventorySku[] = [];
  let after: string | null = null;

  while (results.length < maxItems) {
    const pageSize = Math.min(100, maxItems - results.length);
    const json: GraphqlResponse<InventoryLevelsData> =
      await client.graphql<InventoryLevelsData>(INVENTORY_LEVELS_QUERY, {
        first: pageSize,
        after,
      });

    const connection = json.data?.inventoryItems;
    const edges = connection?.edges ?? [];

    for (const { node } of edges) {
      if (!node.sku) continue;

      const locations = (node.inventoryLevels?.edges ?? []).map(
        (edge: {
          node: {
            location: { id: string; name: string } | null;
            quantities: Array<{ name: string; quantity: number }> | null;
          };
        }) => ({
          id: edge.node.location?.id ?? "",
          name: edge.node.location?.name ?? "",
          available: edge.node.quantities?.[0]?.quantity ?? 0,
        }),
      );
      const available = locations.reduce(
        (sum: number, l: { available: number }) => sum + l.available,
        0,
      );

      results.push({
        inventoryItemId: node.id,
        sku: node.sku,
        title: node.variant?.displayName ?? node.sku,
        available,
        locations,
      });

      if (results.length >= maxItems) break;
    }

    if (!connection?.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor;
    if (!after) break;
  }

  return results;
}

export function findInventoryBySku(
  items: InventorySku[],
  sku: string,
): InventorySku | undefined {
  return items.find((item) => item.sku === sku);
}
