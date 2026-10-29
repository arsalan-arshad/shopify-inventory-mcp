# Inventory MCP Server — Build Plan

## M0 — Spikes and decisions (before code)
- [x] S1 official connector gap · S2 token creation · S3 history depth and limits (answered 2026-10-28 — see `PROJECT_CONTEXT.md` §12)
- [x] Decide D1 (share the math) and D4 (language) — vendor-copy + TypeScript/MCP SDK
- [x] Answer Q1: what does success mean — **stars** (owner 2026-10-28)

## M1 — Core (pure math)
- [x] Port forecasting functions from `forecasting.js` into `src/forecast/` (TypeScript)
- [x] Fixture tests incl. the README example and edge cases (empty / zero demand / zero stock)
- [x] Tool input/output types + JSON schemas (`src/tools/`) — no Shopify calls
- [x] Document defaults (WMA windows, z, lead time, list limit, multi-location sum)

## M2 — Shopify read layer
- [x] Inventory levels, locations, products, order line items to daily units per SKU
- [x] Pagination, rate-limit handling, clear errors
- [x] Multi-location: sum `available` (match Agent Forecast loaders)
- [x] BYOK: static token **or** Dev Dashboard client credentials

## M3 — MCP server
- [x] Four tools, JSON schemas, stdio transport
- [ ] Test with a real MCP client against a **dev store** (needs owner credentials — not done)

## M4 — Docs and launch prep
- [x] README token steps (Dev Dashboard + legacy custom app note)
- [x] Example prompts + Cursor / Claude Desktop MCP config snippets
- [ ] Short demo clip (optional follow-up)
- [x] Repo hygiene per the Playbook (LICENSE, SECURITY, CONTRIBUTING, .env.example, CI, release workflow)
- [x] Public GitHub repo created and pushed (`shopify-inventory-mcp`) — owner override 2026-10-29
- [ ] Directory listing — **ask owner before listing**

## M5 — Measure
- [ ] Track stars, issues, "hosted?" requests for 60 days against the gate in `PROJECT_CONTEXT.md`

## Later
Per-SKU config · CSV export · Reorder Brain tools · hosted tier · Salesforce pipeline signal · bulk ops for 5k+ SKU stores · optional `read_all_orders`
