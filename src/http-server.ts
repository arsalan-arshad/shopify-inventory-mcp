#!/usr/bin/env node
/**
 * Hosted MCP entry — Streamable HTTP (stateless) + Bearer API key.
 * Users bring their own Shopify credentials via request headers (BYOK).
 * Local stdio BYOK continues via `src/server.ts` / `npm start`.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { NextFunction, Request, Response } from "express";
import { AuthConfigError, loadMcpApiKey, requireBearerApiKey } from "./http/auth.js";
import { shopifyConfigFromHeaders } from "./http/shopify-headers.js";
import { getPackageMeta } from "./package-meta.js";
import { ShopifyError } from "./shopify/errors.js";
import { runWithShopifyConfig } from "./shopify/request-context.js";
import { createInventoryMcpServer } from "./server.js";

const MCP_PATH = "/mcp";

export type HttpServerOptions = {
  port?: number;
  host?: string;
  apiKey?: string;
  /** Injected for tests; defaults to createInventoryMcpServer. */
  createServer?: typeof createInventoryMcpServer;
};

function requireShopifyHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const config = shopifyConfigFromHeaders({
      get: (name) => req.header(name) ?? undefined,
    });
    runWithShopifyConfig(config, () => {
      next();
    });
  } catch (err) {
    if (err instanceof ShopifyError && err.code === "missing_shopify_headers") {
      res.status(400).json({
        error: "missing_shopify_credentials",
        message: err.message,
      });
      return;
    }
    if (err instanceof ShopifyError) {
      res.status(400).json({
        error: err.code,
        message: err.message,
      });
      return;
    }
    res.status(400).json({
      error: "invalid_shopify_credentials",
      message: "Could not parse Shopify credentials from headers",
    });
  }
}

export function createHttpApp(options: HttpServerOptions = {}) {
  const meta = getPackageMeta();
  const apiKey = options.apiKey ?? loadMcpApiKey();
  const createServer = options.createServer ?? createInventoryMcpServer;

  // Bind all interfaces on Railway; no Host allow-list (TLS terminated at edge).
  const host = options.host ?? process.env.HOST ?? "0.0.0.0";
  const app = createMcpExpressApp({ host });

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
      service: meta.name,
      version: meta.version,
    });
  });

  const auth = requireBearerApiKey(apiKey);

  const handleMcpPost = async (req: Request, res: Response): Promise<void> => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      // Never include credentials or Authorization material.
      console.error(
        "MCP request failed:",
        err instanceof Error ? err.message : "unknown error",
      );
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    } finally {
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    }
  };

  // Auth → Shopify BYOK headers (ALS) → MCP handler.
  // ALS must wrap the async handler; middleware `next()` alone loses context
  // after the sync stack unwinds, so we bind config here and re-enter ALS.
  app.post(MCP_PATH, auth, (req, res) => {
    try {
      const config = shopifyConfigFromHeaders({
        get: (name) => req.header(name) ?? undefined,
      });
      void runWithShopifyConfig(config, () => handleMcpPost(req, res));
    } catch (err) {
      if (err instanceof ShopifyError) {
        res.status(400).json({
          error:
            err.code === "missing_shopify_headers"
              ? "missing_shopify_credentials"
              : err.code,
          message: err.message,
        });
        return;
      }
      res.status(400).json({
        error: "invalid_shopify_credentials",
        message: "Could not parse Shopify credentials from headers",
      });
    }
  });

  // Stateless mode: no SSE stream / session teardown via GET/DELETE.
  const methodNotAllowed = (_req: Request, res: Response): void => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
  };

  app.get(MCP_PATH, auth, requireShopifyHeaders, methodNotAllowed);
  app.delete(MCP_PATH, auth, requireShopifyHeaders, methodNotAllowed);

  return { app, host, meta };
}

export async function main(): Promise<void> {
  const port = Number.parseInt(process.env.PORT ?? "3000", 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${process.env.PORT ?? ""}`);
  }

  const { app, host, meta } = createHttpApp();
  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, host, () => {
      console.error(
        `${meta.name}@${meta.version} HTTP MCP listening on http://${host}:${port}${MCP_PATH}`,
      );
      console.error(`Health: GET /health (unauthenticated)`);
      console.error(
        "Shopify BYOK via headers: X-Shopify-Store-Domain + Client-Id/Secret (or Admin-Access-Token)",
      );
      resolve();
    });
    server.on("error", reject);
  });
}

const entryHref = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";

if (import.meta.url === entryHref) {
  main().catch((err) => {
    const message =
      err instanceof AuthConfigError || err instanceof Error
        ? err.message
        : String(err);
    console.error(message);
    process.exit(1);
  });
}
