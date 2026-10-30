/**
 * Public HTML landing page for GET /.
 * No secrets; links to GitHub + explains local vs hosted.
 */

import type { PackageMeta } from "../package-meta.js";

const REPO = "https://github.com/arsalan-arshad/shopify-inventory-mcp";
const APP = "https://apps.shopify.com/ai-forecast-agent";

export function renderHomePage(meta: PackageMeta, publicOrigin?: string): string {
  const origin = (publicOrigin ?? "").replace(/\/$/, "");
  const mcpUrl = origin ? `${origin}/mcp` : "/mcp";
  const healthUrl = origin ? `${origin}/health` : "/health";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(meta.name)} — deterministic Shopify inventory MCP</title>
  <meta name="description" content="Open-source MCP server: days of cover, stockout date, and reorder point from your Shopify store. Local BYOK or hosted with your own credentials." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #0f1419;
      --bg-elev: #1a222c;
      --ink: #e8eef4;
      --muted: #8b9aab;
      --accent: #3dd6c3;
      --accent-dim: #2a9d8f;
      --line: #2a3542;
      --warn: #e9c46a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: "IBM Plex Sans", system-ui, sans-serif;
      background:
        radial-gradient(ellipse 80% 50% at 10% -10%, #1a3a36 0%, transparent 55%),
        radial-gradient(ellipse 60% 40% at 100% 0%, #1e2a3a 0%, transparent 50%),
        var(--bg);
      color: var(--ink);
      line-height: 1.55;
    }
    main {
      max-width: 44rem;
      margin: 0 auto;
      padding: 3.5rem 1.5rem 4rem;
    }
    .brand {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 0.85rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      color: var(--accent);
      margin: 0 0 1.25rem;
    }
    h1 {
      font-size: clamp(1.75rem, 4vw, 2.35rem);
      font-weight: 600;
      line-height: 1.2;
      margin: 0 0 0.75rem;
      letter-spacing: -0.02em;
    }
    .lede {
      font-size: 1.05rem;
      color: var(--muted);
      margin: 0 0 1.75rem;
      max-width: 36rem;
    }
    .cta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      margin-bottom: 2.75rem;
    }
    .cta a {
      display: inline-flex;
      align-items: center;
      padding: 0.55rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      border: 1px solid var(--line);
      color: var(--ink);
      background: var(--bg-elev);
      transition: border-color 0.15s, background 0.15s;
    }
    .cta a:hover { border-color: var(--accent-dim); }
    .cta a.primary {
      background: var(--accent);
      color: #0a1210;
      border-color: transparent;
    }
    .cta a.primary:hover { background: #5ee0d0; }
    section {
      margin-bottom: 2.25rem;
    }
    h2 {
      font-size: 1.05rem;
      font-weight: 600;
      margin: 0 0 0.65rem;
    }
    p { margin: 0 0 0.75rem; color: var(--muted); }
    ul {
      margin: 0 0 0.75rem;
      padding-left: 1.15rem;
      color: var(--muted);
    }
    li { margin-bottom: 0.25rem; }
    pre {
      margin: 0.75rem 0 0;
      padding: 1rem 1.1rem;
      overflow-x: auto;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 0.72rem;
      line-height: 1.45;
      background: var(--bg-elev);
      border: 1px solid var(--line);
      border-radius: 8px;
      color: #c5d4e0;
    }
    .meta {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 2.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--line);
    }
    .meta a { color: var(--accent); }
    .note {
      font-size: 0.85rem;
      color: var(--warn);
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <main>
    <p class="brand">${escapeHtml(meta.name)} · v${escapeHtml(meta.version)}</p>
    <h1>Inventory forecasts your assistant can audit</h1>
    <p class="lede">
      Open-source MCP tools for days of cover, stockout date, and reorder point —
      deterministic math from your Shopify Admin data. Not affiliated with Shopify.
    </p>
    <div class="cta">
      <a class="primary" href="${escapeHtml(REPO)}">GitHub repo</a>
      <a href="${escapeHtml(mcpUrl)}">MCP endpoint</a>
      <a href="${escapeHtml(healthUrl)}">Health</a>
      <a href="${escapeHtml(APP)}">Agent Forecast app</a>
    </div>

    <section>
      <h2>Tools</h2>
      <ul>
        <li><code>list_at_risk_skus</code></li>
        <li><code>get_sku_forecast</code></li>
        <li><code>get_reorder_suggestion</code></li>
        <li><code>explain_forecast_inputs</code></li>
      </ul>
    </section>

    <section>
      <h2>1 · Local (stdio BYOK)</h2>
      <p>Run on your machine. Shopify credentials stay in env.</p>
<pre>{
  "mcpServers": {
    "shopify-inventory": {
      "command": "node",
      "args": ["/path/to/dist/server.js"],
      "env": {
        "SHOPIFY_STORE_DOMAIN": "your-store.myshopify.com",
        "SHOPIFY_CLIENT_ID": "your-client-id",
        "SHOPIFY_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}</pre>
    </section>

    <section>
      <h2>2 · Hosted (this server)</h2>
      <p>Point your client at <code>${escapeHtml(mcpUrl)}</code>. Send <strong>your</strong> Shopify credentials as headers — the host is infrastructure only.</p>
<pre>{
  "mcpServers": {
    "shopify-inventory": {
      "url": "${escapeHtml(mcpUrl)}",
      "headers": {
        "X-Shopify-Store-Domain": "your-store.myshopify.com",
        "X-Shopify-Client-Id": "your-client-id",
        "X-Shopify-Client-Secret": "your-client-secret"
      }
    }
  }
}</pre>
      <p class="note">POST /mcp only. Tool results still go to your model provider via the MCP client.</p>
    </section>

    <p class="meta">
      MIT · <a href="${escapeHtml(REPO)}">${escapeHtml(REPO.replace("https://", ""))}</a>
      · Docs in the repo README
    </p>
  </main>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
