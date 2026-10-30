/**
 * Service identity for health checks and MCP server metadata.
 * Reads package.json next to dist/ (or repo root when running from src via vitest).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type PackageMeta = {
  name: string;
  version: string;
};

let cached: PackageMeta | null = null;

export function getPackageMeta(): PackageMeta {
  if (cached) return cached;
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "..", "package.json"),
    join(process.cwd(), "package.json"),
  ];
  for (const path of candidates) {
    try {
      const raw = JSON.parse(readFileSync(path, "utf8")) as {
        name?: string;
        version?: string;
      };
      cached = {
        name: raw.name ?? "shopify-inventory-mcp",
        version: raw.version ?? "0.0.0",
      };
      return cached;
    } catch {
      // try next
    }
  }
  cached = { name: "shopify-inventory-mcp", version: "0.0.0" };
  return cached;
}
