# Security

This server is **read-only**: it reads inventory, orders, and products from a store you own, using credentials you supply. It never writes to the store.

**Local stdio (BYOK):** Credentials stay on your machine. Do not paste tokens or client secrets into issues, PRs, or chats.

**Hosted HTTP (Railway):** Clients send Shopify BYOK headers (`X-Shopify-Store-Domain`, client id/secret or admin token). Missing Shopify headers → 400. No shared Bearer/`MCP_API_KEY`. Railway need not store Shopify secrets. Hosted mode means client secrets reach your server over HTTPS; prefer local stdio for maximum privacy. See [`docs/HOSTED.md`](docs/HOSTED.md).

**Caveat:** tool *results* (SKU titles, stock levels, notes) are sent to the model provider by your MCP client. Treat that channel as untrusted egress for store data.

If you find a security issue, please **do not open a public issue**. Email
**arsalanarshad.dev@gmail.com** instead with details. We’ll acknowledge within a few days.
