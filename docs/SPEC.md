# Inventory MCP Server — Spec

_Status: v0 — M1–M4 shipped; public GitHub publish. Live store E2E still pending (needs owner credentials)._

## 1. Scope
- **v0:** four read-only tools over stdio, deterministic math, BYOK token (static or client credentials), docs. Store-wide lead time only.
- **Non-goals (v0):** writes of any kind, hosted service, OAuth for third-party merchants, multi-store, UI, per-SKU config (v1), telemetry, bulk operations.

## 2. Pure functions (no network, no AI)
Vendor-copied from Agent Forecast `../shopify-ai-forecast-app/app/lib/forecasting.js` into `src/forecast/`:
`weightedMovingAverage`, `calculateReorderPoint`, `daysOfCover`, `classifyStockStatus`.

### Defaults (locked from source + README)
| Constant | Value | Source |
|---|---|---|
| Standalone WMA `periods` default | **4** | `weightedMovingAverage(..., periods = 4)` |
| Reorder-point WMA window | **14** | hard-coded in `calculateReorderPoint` |
| `serviceLevelZ` | **1.65** (~95%) | `calculateReorderPoint` default |
| Store-wide `leadTimeDays` | **21** | README worked example (v0 default) |
| `list_at_risk_skus` default `limit` | **50** | M1 pick; document in schemas |
| History window | **30** days | Agent Forecast `getUsageHistory` |
| Rounding | `round2` = `Math.round(n * 100) / 100` | forecasting.js |
| Multi-location stock | **sum `available`** | Agent Forecast `forecast-snapshot.server.js` |

### “At risk” vs `classifyStockStatus`
README “at risk” means days of cover **at or below** lead time. That is exactly `classifyStockStatus` → **`reorder_now`** (`daysOfCover <= leadTimeDays`). The softer band `reorder_soon` (`<= 1.5 × leadTime`) is **not** included in `list_at_risk_skus`.

## 3. Tool contracts
| Tool | Input | Output |
|---|---|---|
| `list_at_risk_skus` | `limit?` (default 50), `leadTimeDays?` (default 21) | `[{ sku, title, stock, dailyDemand, daysOfCover, stockoutDate, status }]` |
| `get_sku_forecast` | `sku`, `leadTimeDays?` | one row as above plus the history window used |
| `get_reorder_suggestion` | `sku`, `leadTimeDays?`, `serviceLevelZ?` | `{ reorderPoint, safetyStock, belowReorderPoint }` |
| `explain_forecast_inputs` | `sku` | formula names, window length, data range, caveats |
Every response carries `generatedAt` and a `dataRange`, and states when history is too short to trust (&lt; 7 non-zero sales days).

Handlers: `src/tools/handlers.ts`. MCP registration: `src/server.ts`.

## 4. Data and limits
- Orders aggregated to daily units per SKU **in memory**; no persistence in v0.
- `read_orders` → last **60 days** of orders. Older history needs `read_all_orders` (not required in v0).
- Caps: `MAX_INVENTORY_ITEMS` (default 2000), `MAX_ORDER_PAGES` (default 24 × 50 orders). Truncation is surfaced in tool notes.
- Return sizes capped (`limit` default 50).

## 5. Spikes (answered 2026-10-28)
| # | Answer |
|---|---|
| **S1** | Official Shopify MCP = UCP storefront/cart/checkout — no Admin inventory forecasts. Gap confirmed. |
| **S2** | New admin custom apps blocked; use Dev Dashboard + client credentials (24h), or existing custom-app static token. |
| **S3** | 60-day `read_orders` window; cost-based GraphQL limits; bulk ops for large catalogs (later). |

## 6. Security
- Read-only scopes; token / client secret from env, never logged; errors redact secrets.
- Prompt-injection note: product titles are untrusted text returned to a model.
- Local mode: credentials stay on the machine; tool **results** still go to the model provider via the MCP client.
