# Shopify read layer (M2)

- **Auth:** `SHOPIFY_ADMIN_ACCESS_TOKEN` (legacy custom apps) **or** Dev Dashboard `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` (24h client-credentials tokens).
- **Inventory:** paginate `inventoryItems`, sum `available` across up to 10 locations (match Agent Forecast).
- **Orders:** paginate recent orders → dense daily usage per SKU. `read_orders` = last **60 days** only.
- **No persistence / no writes.** Large catalogs: raise `MAX_INVENTORY_ITEMS` / `MAX_ORDER_PAGES` or use bulk ops later.
