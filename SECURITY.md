# Security

This server is **read-only**: it reads inventory, orders, and products from a store you own, using credentials you supply. It never writes to the store.

Credentials stay on your machine (local stdio mode). Do not paste tokens or client secrets into issues, PRs, or chats.

**Caveat:** tool *results* (SKU titles, stock levels, notes) are sent to the model provider by your MCP client. Treat that channel as untrusted egress for store data.

If you find a security issue, please **do not open a public issue**. Email
**arsalanarshad.dev@gmail.com** instead with details. We’ll acknowledge within a few days.
