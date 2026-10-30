/**
 * Bearer API-key gate for the hosted HTTP MCP endpoint.
 * Never log the expected key or the presented token.
 */

import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigError";
  }
}

/** Load the required shared secret for HTTP MCP. */
export function loadMcpApiKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = (env.MCP_API_KEY ?? "").trim();
  if (!key) {
    throw new AuthConfigError(
      "MCP_API_KEY is required for the HTTP MCP server (set a long random secret)",
    );
  }
  return key;
}

/**
 * Parse `Authorization: Bearer <token>`.
 * Returns null when missing or not a Bearer scheme.
 */
export function extractBearerToken(
  authorizationHeader: string | undefined | null,
): string | null {
  if (!authorizationHeader) return null;
  const trimmed = authorizationHeader.trim();
  const match = /^Bearer\s+(\S+)$/i.exec(trimmed);
  return match?.[1] ?? null;
}

/** Constant-time string compare (false when lengths differ). */
export function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Touch both buffers so timing does not short-circuit solely on length.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function isValidBearerApiKey(
  authorizationHeader: string | undefined | null,
  expectedApiKey: string,
): boolean {
  const presented = extractBearerToken(authorizationHeader);
  if (presented === null) return false;
  return timingSafeEqualString(presented, expectedApiKey);
}

function sendUnauthorized(res: Response): void {
  res.setHeader("WWW-Authenticate", 'Bearer realm="shopify-inventory-mcp"');
  res.status(401).json({
    error: "unauthorized",
    message: "Missing or invalid Bearer token",
  });
}

/**
 * Express middleware: require `Authorization: Bearer <MCP_API_KEY>`.
 * Does not log secrets or the Authorization header value.
 */
export function requireBearerApiKey(expectedApiKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isValidBearerApiKey(req.header("authorization"), expectedApiKey)) {
      sendUnauthorized(res);
      return;
    }
    next();
  };
}
