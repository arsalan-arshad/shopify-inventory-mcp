/**
 * Admin GraphQL queries — mirrored from Agent Forecast
 * `../shopify-ai-forecast-app/app/graphql/queries.js`.
 */

export const RECENT_ORDERS_QUERY = `#graphql
  query RecentOrders($first: Int!, $after: String) {
    orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
      edges {
        cursor
        node {
          id
          createdAt
          lineItems(first: 50) {
            edges {
              node {
                quantity
                sku
                title
                variant {
                  id
                  inventoryItem {
                    id
                  }
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const INVENTORY_LEVELS_QUERY = `#graphql
  query InventoryLevels($first: Int!, $after: String) {
    inventoryItems(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          sku
          variant {
            displayName
          }
          inventoryLevels(first: 10) {
            edges {
              node {
                location {
                  id
                  name
                }
                quantities(names: ["available"]) {
                  name
                  quantity
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
