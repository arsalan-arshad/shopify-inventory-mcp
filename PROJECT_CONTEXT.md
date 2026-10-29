# Inventory MCP Server — Project Context (for Claude)

_Snapshot: 2026-10-29 · **v0 ship** — M1–M4 done; public GitHub repo **allowed and in progress** (`shopify-inventory-mcp`) · owner override lifted “no repo yet” lock · npm registry publish still not required for v0 · priority: ship then measure gate._
_Contains NO secrets. Never paste `.env` values or tokens into chat or docs._

## 1. What this is
An open-source (MIT) MCP server that exposes deterministic inventory-forecasting tools (days of cover, projected stockout date, reorder point, at-risk SKUs) over a Shopify store, so any MCP client can answer "what will I run out of, and when?" with auditable numbers instead of guessed ones. See `README.md`, `docs/SPEC.md`.

## 2. Why build it (honest read)
- **Purpose is distribution, not revenue.** It puts the Agent Forecast engine where merchants and developers already look (GitHub, MCP directories, AI assistants) and funnels interest to the paid Agent Forecast app and, later, a hosted tier.
- **Cheap:** reuses the existing pure math; about two weeks to a usable v0.
- **Differentiator vs the official Shopify MCP/connector:** those read data; this computes forecasts. The tools return forecasts the model cannot invent. (Verify what the official connector offers before launch — Spike S1.)
- **Risk:** MCP servers are commodity and directory listings are crowded; stars do not equal paying merchants. Judge it by the gate below, not by effort spent.

## 3. Gate (estimates, not data)
Within 60 days of launch: 300+ GitHub stars and 20+ people asking for a hosted version. If neither, stop and fold the learning into Agent Forecast.
**Owner locked 2026-10-28:** gate still yes (300 stars + 20 hosted asks in 60 days). Success metric for Q1 = **stars**.

## 4. Where the code will live
Repo name / branding: **`shopify-inventory-mcp`**. **Public GitHub repo allowed** (owner override 2026-10-29). Publish target for v0 = **GitHub public repo** (not npm registry unless later required). Do not imply Shopify affiliation in marketing claims. The math is shared with the Agent Forecast engine via vendor-copy (D1).

## 5. Relationship to other projects
- **01 AI Forecast Agent:** source of the engine; the MCP server is its open-source funnel.
- **07 Reorder Brain:** adds lead time, MOQ, pack size and draft POs on the same engine; the MCP server should expose those as tools once 07 has a stable core.
- **02 Pipeline-Aware Forecast:** a future tool could combine Salesforce pipeline into the stockout date.
- **Priority (owner 2026-10-28):** after **04** (04-practitioner-protocols).

## 6. Open decisions
~~- **D1 — Sharing the math:** vendor-copy `forecasting.js` with fixture tests (fast, drift risk) vs extract an npm package both repos use (cleaner, more work).~~
~~- **D2 — Auth for v0:** user-created Admin API token in local config (BYOK) — confirm how new tokens are created under current Shopify rules (Spike S2).~~
~~- **D3 — Transport:** stdio first; remote/OAuth only for the hosted tier.~~
~~- **D4 — Language:** TypeScript on the official MCP SDK (default) vs plain JS to match the engine.~~

**Resolved (see §11):**
- **D1:** vendor-copy `forecasting.js` + fixtures for v0.
- **D2:** BYOK token via env.
- **D3:** stdio only for v0; hosted/OAuth out of scope.
- **D4:** TypeScript + official MCP SDK (Node 20, npm).

## 7. Open questions for the owner
~~- **Q1:** Is the goal stars/credibility, hosted revenue, or app installs? (It changes what we measure.)~~
~~- **Q2:** Should the repo name carry the Agent Forecast brand or stay generic?~~

**Answered (owner 2026-10-28):**
- **Q1:** success metric = **stars**.
- **Q2:** repo name/branding = **shopify-inventory-mcp** (do not imply Shopify affiliation in marketing claims).

## 8. Platform facts (verified 2026-10-28 — see §12)
- **S2:** New admin-created custom apps can no longer be created; existing ones still work with a static token. New setups: Dev Dashboard app + client credentials (24h tokens).
- **S3:** `read_orders` = last **60 days**; `read_all_orders` (with `read_orders`) for older history. GraphQL cost bucket (100/200/1000 pts/s by plan). Bulk ops for large exports.
- **S1:** Official Shopify MCP is UCP storefront/cart/checkout/customer — **not** Admin inventory forecasting. Gap remains.
- Directory listing requirements still open (ask before listing).

## 9. Punch list
**Done:** Q1/Q2; D1–D4; M1–M3; S1–S3; M4 docs polish (README prompts + MCP snippets, LICENSE/SECURITY/CONTRIBUTING/.env.example/CI); public repo lock lifted.
**Open / publish punch list:** push public `shopify-inventory-mcp`; live E2E with owner credentials; optional demo clip; **ask before** MCP directory listing; measure gate (M5).
**Resolved:** D1–D4, Q1, Q2; priority after 04; gate confirmed; public GitHub allowed (2026-10-29).

## 10. Working agreements
- Read-only; deterministic core; AI explains only; BYOK; no secrets in chat.
- **Superseded 2026-10-29 for GitHub push:** owner explicitly ordered create + push of public `shopify-inventory-mcp`. Still ask before npm publish, releases that cut tags without being asked, and **directory listings**. Do not touch `../salesforce` or modify Agent Forecast.
- One contact email everywhere: arsalanarshad.dev@gmail.com. Follow `../OPEN_SOURCE_APP_PLAYBOOK.md`.
- Keep this doc append-only with numbered sections; mark superseded items.

## 11. Claude A–G + owner lock (2026-10-28)

Claude’s revise-then-conditionally-build verdict and owner answers. Supersedes open items in §6–§7 and the prior §9 punch list where they conflict.

### A) Priority verdict: **Revise, then conditionally build**
- Documented intent: distribution, not revenue — cheap OSS funnel for Agent Forecast (§2).
- Coding path approved for **M1 only** (pure math + fixtures + types). No platform risk in M1.
- **Do not yet:** M2 onward, repo creation, publishing, npm, or directory listings. M2 waits on S2/S3 and explicit owner approval.
- Differentiator (forecast math vs read-only community MCP servers) is plausible but **S1 still unverified** against Shopify’s own docs.

### B) Resolved decisions
| Item | Decision |
|---|---|
| **D1** | Vendor-copy `forecasting.js` + fixtures for v0. Revisit a shared npm package once 07 needs the same core. |
| **D4** | TypeScript + official MCP SDK. Node 20, npm. |
| **D2 / D3** | BYOK token via env; **stdio only**. Hosted and OAuth out of scope for v0. |
| **Layout** | `src/forecast/` (pure), `src/shopify/` (read layer stub), `src/tools/`, `src/server.ts`, `test/fixtures/`. |
| **Q1** | Success metric = **stars** (owner). |
| **Q2** | Repo name/branding = **shopify-inventory-mcp**; do not imply Shopify affiliation (owner). |
| **Priority** | After **04** (04-practitioner-protocols) (owner). |
| **Public repo** | **Yes (2026-10-29 override)** — create/push public `shopify-inventory-mcp`; npm registry optional / not required for v0. |
| **Gate** | Still yes: 300 stars + 20 hosted asks in 60 days (owner). |

### C) Frozen MVP checklist
- Four tools as in SPEC §3: `list_at_risk_skus`, `get_sku_forecast`, `get_reorder_suggestion`, `explain_forecast_inputs`.
- Every response carries `generatedAt` and `dataRange`, and flags history that is too short to trust.
- Empty history, zero demand, and zero stock return defined, non-NaN results.
- Return sizes capped; **`list_at_risk_skus` default `limit` = 50**.
- Read-only scopes only: `read_inventory`, `read_locations`, `read_orders`, `read_products`.
- No persistence and no telemetry.
- **Defaults (from `forecasting.js` + README):** standalone WMA window = **4**; reorder-point WMA window = **14**; `serviceLevelZ` = **1.65**; store-wide lead time default = **21** days (README example). Per-SKU lead time is **v1** — v0 is store-wide env / tool param only.
- **Multi-location:** match Agent Forecast loaders — **sum `available`** across locations.
- **Non-goals (strict):** writes, hosted service, OAuth, multi-store, UI, Salesforce signal, Reorder Brain tools, telemetry.

### D) Spike status
- **S1 (partial, unverified):** community Admin-API MCP servers read orders/inventory but do not ship deterministic forecast math; verify against Shopify docs before claiming a gap.
- **S2 (not run):** token-creation path for an individual store owner must be verified before README token steps.
- **S3 (not run):** order-history depth, rate limits, bulk ops for ~5k SKUs — likeliest pitch-killer if history is thin.
- Extra scopes: none planned.

### E) Open owner questions — answered
1. Coding / M1 approved: **YES**. Public repo: **NO** (yet).
2. Q1 = stars; Q2 = `shopify-inventory-mcp` (no affiliation claims).
3. Priority: after 04.
4. Parent README / APP_PLANS omitting 06/07: still unexplained; not blocking M1.
5. Gate still current: yes.

### F) First implementation slice (M1) — in progress / done this session
1. Read `forecasting.js`; record signatures and defaults.
2. Port four pure functions into `src/forecast/` as TypeScript with source attribution.
3. Fixtures from README example + empty / zero-demand / zero-stock; pin `round2`.
4. Reconcile README “at risk” with `classifyStockStatus` (`reorder_now`).
5. Tool input/output types + JSON schemas — no Shopify calls.
6. **Stop before M2.**

### G) Claim guardrails
- Qualify “no data leaves your machine”: tool results go to the model provider via the MCP client.
- “Covered by fixture tests” only after tests exist (now true for M1 math).
- Do not imply Shopify affiliation; do not call it “AI forecasting” — numbers are deterministic.
- Standing rules: ask before publish/push/release/listing; do not touch `../salesforce` or modify the live Agent Forecast app; contact `arsalanarshad.dev@gmail.com`.

## 12. Spikes S1–S3 + M2/M3 (2026-10-28)

Owner approved continuing past M1. Answers below are from Shopify’s own docs (not third-party blogs alone).

### S1 — Official MCP gap
Shopify’s current MCP surface is **UCP / agentic commerce**: storefront catalog, cart, checkout, customer accounts, orders for agent-placed purchases (`/api/ucp/mcp`). It does **not** expose Admin inventory forecasting (days of cover, reorder point, at-risk SKUs). Differentiator claim is valid: this server fills Admin-side deterministic forecast tools.

### S2 — Token creation today
- **Cannot** create new admin-created custom apps (`Apps → Develop apps`). Existing ones keep working; token under API credentials.
- **New path:** [Dev Dashboard](https://shopify.dev/docs/apps/build/dev-dashboard/create-apps-using-dev-dashboard) → create app → version with scopes → install on store → App settings → Client ID/secret → [client credentials grant](https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant) (token ≈ 24h).
- v0 supports **both** `SHOPIFY_ADMIN_ACCESS_TOKEN` and `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`.

### S3 — History, limits, bulk
- `read_orders`: orders created in the **last 60 days** only.
- `read_all_orders`: must be declared **alongside** `read_orders`; extends access to older orders (protected / approval). Alone grants nothing.
- GraphQL Admin rate limits (cost bucket): Standard 100 pts/s, Advanced 200, Plus 1000.
- Pagination soft cap ~25k objects; for large catalogs use [bulk operations](https://shopify.dev/docs/apps/build/apis/graphql-admin/bulk-operations/queries).
- v0: paginated reads with `MAX_INVENTORY_ITEMS` (2000) and `MAX_ORDER_PAGES` (24); flag truncation in tool notes. Bulk ops = later.

### M2 / M3 delivered
- `src/shopify/`: config, auth, GraphQL client (throttle retry), inventory (sum available), orders → dense daily usage, snapshot loader.
- `src/tools/handlers.ts` + `src/server.ts`: four tools over stdio MCP.

## 13. M4 + public ship (2026-10-29)

Owner override: finish v0 and **publish ASAP**; earlier “no repo yet” lock lifted.

**M4 polish:**
- LICENSE (MIT), README install/run + example prompts + Cursor/Claude Desktop MCP snippets (absolute-path placeholder).
- Softened claims: deterministic forecasts, not “AI forecasting”; BYOK egress caveat retained.
- `.env.example`, `SECURITY.md`, `CONTRIBUTING.md`, `.gitignore`, CI + release workflows.
- `package.json`: name `shopify-inventory-mcp`, version `0.1.0`, bin, engines node≥20, repository URL.
- Publish target: **public GitHub** under `arsalan-arshad/shopify-inventory-mcp` (npm registry not required for v0).

**Still optional / ask first:** demo clip; MCP directory listing; live store E2E; npm publish.
