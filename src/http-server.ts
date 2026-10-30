#!/usr/bin/env node
/**
 * Hosted MCP entry — Streamable HTTP (stateless) + Bearer API key.
 * Shopify credentials stay server-side (single-tenant portfolio demo).
 * Local stdio BYOK continues via `src/server.ts` / `npm start`.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { Request, Response } from "express";
import { AuthConfigError, loadMcpApiKey, requireBearerApiKey } from "./http/auth.js";
import { getPackageMeta } from "./package-meta.js";
import { createInventoryMcpServer } from "./server.js";

const MCP_PATH = "/mcp";

export type HttpServerOptions = {
  port?: number;
  host?: string;
  apiKey?: string;
  /** Injected for tests; defaults to createInventoryMcpServer. */
  createServer?: typeof createInventoryMcpServer;
};

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

  app.post(MCP_PATH, auth, (req, res) => {
    void handleMcpPost(req, res);
  });

  // Stateless mode: no SSE stream / session teardown via GET/DELETE.
  const methodNotAllowed = (_req: Request, res: Response): void => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed." },
      id: null,
    });
  };

  app.get(MCP_PATH, auth, methodNotAllowed);
  app.delete(MCP_PATH, auth, methodNotAllowed);

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
