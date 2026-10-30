# Hosted MCP (Railway) — BYOK via headers

**Hosted = infrastructure only.** The Railway app serves Streamable HTTP MCP.  
**Each user brings their own Shopify credentials** in request headers.  
Railway only needs a shared gateway key: **`MCP_API_KEY`**.

Local **stdio + env BYOK** (`npm start`) is unchanged.

---

## Two ways to run

### 1) Local (stdio)

```json
{
  "mcpServers": {
    "shopify-inventory": {
      "command": "node",
      "args": ["/absolute/path/to/shopify-inventory-mcp/dist/server.js"],
      "env": {
        "SHOPIFY_STORE_DOMAIN": "your-store.myshopify.com",
        "SHOPIFY_CLIENT_ID": "your-client-id",
        "SHOPIFY_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### 2) Hosted (URL + headers)

```json
{
  "mcpServers": {
    "shopify-inventory": {
      "url": "https://shopify-inventory-mcp-production-e5fd.up.railway.app/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY",
        "X-Shopify-Store-Domain": "your-store.myshopify.com",
        "X-Shopify-Client-Id": "your-client-id",
        "X-Shopify-Client-Secret": "your-client-secret"
      }
    }
  }
}
```

Optional instead of client id/secret:

```json
"X-Shopify-Admin-Access-Token": "shpat_..."
```

Optional: `X-Shopify-Lead-Time-Days` (default 21).

---

## Auth model

| Layer | What |
|---|---|
| Client → MCP HTTP | `Authorization: Bearer <MCP_API_KEY>` (missing/invalid → **401**) |
| Client → MCP HTTP | Shopify BYOK headers (missing → **400**) |
| MCP → Shopify | Uses **that request’s** credentials only |
| `/health` | Unauthenticated |

Generate the gateway key once (`openssl rand -hex 32`). Put it on Railway as `MCP_API_KEY`. Share it with people you trust (or rotate often).

**Trust note:** Hosted mode sends Shopify client secrets to *your* server over HTTPS. For maximum privacy, use local stdio instead.

---

## Railway env vars

| Variable | Required | Notes |
|---|---|---|
| `MCP_API_KEY` | **yes** | Gateway Bearer secret |
| `PORT` | set by Railway | Listen port |
| `SHOPIFY_*` | **no** | Do **not** keep store secrets on Railway for multi-user BYOK — delete them after upgrading |

Optional server defaults (only if you still want a demo fallback later): none required for BYOK headers mode.

---

## Deploy / upgrade checklist

1. Deploy this version (Dockerfile already set).
2. Ensure `MCP_API_KEY` is set.
3. **Remove** `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `SHOPIFY_ADMIN_ACCESS_TOKEN` from Railway Variables (users send their own).
4. Redeploy if needed.
5. Clients use the hosted JSON config above with **their** Shopify app credentials.

Health: `GET https://<domain>/health` → `{ "ok": true, ... }`

---

## Security

- Rotate `MCP_API_KEY` if it leaks.
- Never log Authorization or X-Shopify-* secret headers.
- Tool results still go to the model provider via the MCP client.
- Not affiliated with Shopify. Not a multi-tenant SaaS with accounts/billing — just a shared host + per-request BYOK.
