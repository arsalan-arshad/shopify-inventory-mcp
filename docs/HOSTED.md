# Hosted MCP (Railway) — BYOK via Shopify headers

**Hosted = infrastructure only.** The Railway app serves Streamable HTTP MCP.  
**Each user brings their own Shopify credentials** in request headers.  
There is **no** shared Bearer / `MCP_API_KEY` gate.

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

### 2) Hosted (URL + Shopify headers)

```json
{
  "mcpServers": {
    "shopify-inventory": {
      "url": "https://shopify-inventory-mcp-production-e5fd.up.railway.app/mcp",
      "headers": {
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

Missing Shopify headers → **400**.

---

## Railway env vars

| Variable | Required | Notes |
|---|---|---|
| `PORT` | set by Railway | Listen port |
| `MCP_API_KEY` | **no** | Not used |
| `SHOPIFY_*` | **no** | Users send credentials in headers — delete any old Shopify vars from Railway |

---

## Deploy / upgrade checklist

1. Deploy this version.
2. **Remove** `MCP_API_KEY` and all `SHOPIFY_*` from Railway Variables (optional cleanup).
3. Clients use the hosted JSON config above with **their** Shopify app credentials.

Health: `GET https://<domain>/health` → `{ "ok": true, ... }`

---

## Security

- Anyone who knows the public URL can hit `/mcp`; useful work still needs valid Shopify credentials in headers.
- Hosted mode sends Shopify client secrets to *your* server over HTTPS — prefer local stdio for maximum privacy.
- Never log `X-Shopify-*` secret headers.
- Tool results still go to the model provider via the MCP client.
- Not affiliated with Shopify.
