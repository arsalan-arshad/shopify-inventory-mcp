# Hosted MCP (Railway) — portfolio demo

**Status:** upcoming **0.2.0-hosted** (shipped on `main` once the PR merges).  
**Scope:** single-tenant demo store. Shopify credentials live only in Railway env. Clients authenticate with a shared **Bearer API key** (`MCP_API_KEY`). There is **no** Shopify OAuth and **no** multi-merchant tenancy yet.

Local **stdio + BYOK** (`npm start` / `dist/server.js`) is unchanged — keep using that when you want your own store credentials on your machine.

---

## Auth model (locked)

| Layer | What |
|---|---|
| Client → MCP HTTP | `Authorization: Bearer <MCP_API_KEY>` on `/mcp` (missing/invalid → **401**) |
| MCP → Shopify | Server-side env only: `SHOPIFY_STORE_DOMAIN` + client credentials **or** static Admin token |
| `/health` | Unauthenticated liveness for Railway |

Generate a long random key (e.g. `openssl rand -hex 32`). Rotate by changing Railway `MCP_API_KEY` and updating client configs. Never commit the key or log `Authorization` values.

This is a **portfolio / demo** gate, not per-merchant OAuth. Do not point arbitrary merchants at this URL until multi-tenant auth exists.

---

## Required Railway env vars

| Variable | Required | Notes |
|---|---|---|
| `MCP_API_KEY` | **yes** | Shared secret; clients send as Bearer token |
| `SHOPIFY_STORE_DOMAIN` | **yes** | e.g. `your-store.myshopify.com` |
| `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` | one of | Dev Dashboard app (recommended) |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | one of | Legacy static Admin token instead of client ID/secret |
| `PORT` | set by Railway | Server listens on `HOST` (default `0.0.0.0`) + `PORT` |
| `LEAD_TIME_DAYS` / `HISTORY_DAYS` / … | optional | Same overrides as local `.env.example` |

---

## Deploy on Railway

1. Push this repo (or connect [arsalan-arshad/shopify-inventory-mcp](https://github.com/arsalan-arshad/shopify-inventory-mcp)) to Railway.
2. New project → **Deploy from GitHub** → select the repo / branch with HTTP support.
3. Railway should pick up `Dockerfile` + `railway.toml` (health check `GET /health`).
4. In **Variables**, set `MCP_API_KEY`, `SHOPIFY_STORE_DOMAIN`, and either client credentials or `SHOPIFY_ADMIN_ACCESS_TOKEN`.
5. Deploy. Copy the public HTTPS domain Railway assigns (e.g. `https://shopify-inventory-mcp-production.up.railway.app`).
6. MCP endpoint: `https://<railway-domain>/mcp`  
   Health: `https://<railway-domain>/health` → `{ "ok": true, "service": "shopify-inventory-mcp", "version": "…" }`

### Local container smoke-test (optional)

```bash
docker build -t shopify-inventory-mcp .
docker run --rm -p 3000:3000 \
  -e MCP_API_KEY=dev-only-not-for-prod \
  -e SHOPIFY_STORE_DOMAIN=your-store.myshopify.com \
  -e SHOPIFY_CLIENT_ID=... \
  -e SHOPIFY_CLIENT_SECRET=... \
  shopify-inventory-mcp
curl -s http://127.0.0.1:3000/health
```

Without Docker: `MCP_API_KEY=... npm run build && npm run start:http`

---

## Remote MCP client config

Replace the URL and keep the key out of git (env interpolation preferred).

### Cursor (`~/.cursor/mcp.json` or project `.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "shopify-inventory-hosted": {
      "url": "https://YOUR-APP.up.railway.app/mcp",
      "headers": {
        "Authorization": "Bearer ${env:MCP_API_KEY}"
      }
    }
  }
}
```

Set `MCP_API_KEY` in your shell environment to the same value as Railway.

### Claude / other Streamable HTTP clients

Same shape when the client supports remote URL + headers:

```json
{
  "mcpServers": {
    "shopify-inventory-hosted": {
      "url": "https://YOUR-APP.up.railway.app/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY"
      }
    }
  }
}
```

Prefer env references over pasting the raw key into a file you might commit.

---

## Security notes

- **Demo / single store only.** Shopify tokens never leave the Railway service; clients never see them.
- **Rotate `MCP_API_KEY`** if it leaks; treat it like a password shared with anyone who can call your tools.
- Tool **results** (SKU titles, stock, notes) still flow to the model provider via the MCP client — same egress caveat as local mode.
- No Shopify OAuth, billing, or multi-store routing in this release.
- Do not advertise this URL as a public multi-merchant SaaS until that work lands.

---

## Transport details

- Official `@modelcontextprotocol/sdk` **Streamable HTTP** transport in **stateless** mode (`sessionIdGenerator: undefined`).
- `POST /mcp` — authenticated MCP JSON-RPC.
- `GET` / `DELETE /mcp` — authenticated, currently **405** (stateless; no SSE session).
- `GET /health` — open.

Stdio entry remains `npm start` → `node dist/server.js`.
