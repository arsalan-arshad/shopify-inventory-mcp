import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
  AuthConfigError,
  extractBearerToken,
  isValidBearerApiKey,
  loadMcpApiKey,
  requireBearerApiKey,
  timingSafeEqualString,
} from "../src/http/auth.js";

describe("extractBearerToken", () => {
  it("parses Bearer tokens (case-insensitive scheme)", () => {
    expect(extractBearerToken("Bearer secret-value")).toBe("secret-value");
    expect(extractBearerToken("bearer secret-value")).toBe("secret-value");
    expect(extractBearerToken("  Bearer   secret-value  ")).toBe("secret-value");
  });

  it("rejects missing or non-Bearer schemes", () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken("")).toBeNull();
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken("Bearer")).toBeNull();
    expect(extractBearerToken("Bearer ")).toBeNull();
  });
});

describe("timingSafeEqualString / isValidBearerApiKey", () => {
  it("accepts only exact Bearer matches", () => {
    const key = "portfolio-demo-key-9f3a";
    expect(isValidBearerApiKey(`Bearer ${key}`, key)).toBe(true);
    expect(isValidBearerApiKey(`Bearer wrong`, key)).toBe(false);
    expect(isValidBearerApiKey(undefined, key)).toBe(false);
    expect(isValidBearerApiKey("Bearer ", key)).toBe(false);
  });

  it("compares strings in constant-ish time path", () => {
    expect(timingSafeEqualString("abc", "abc")).toBe(true);
    expect(timingSafeEqualString("abc", "abd")).toBe(false);
    expect(timingSafeEqualString("ab", "abc")).toBe(false);
  });
});

describe("loadMcpApiKey", () => {
  it("requires a non-empty MCP_API_KEY", () => {
    expect(() => loadMcpApiKey({})).toThrow(AuthConfigError);
    expect(() => loadMcpApiKey({ MCP_API_KEY: "   " })).toThrow(AuthConfigError);
    expect(loadMcpApiKey({ MCP_API_KEY: "  ok-key  " })).toBe("ok-key");
  });
});

describe("requireBearerApiKey middleware", () => {
  function mockRes() {
    const res = {
      statusCode: 200,
      body: undefined as unknown,
      headers: {} as Record<string, string>,
      setHeader(k: string, v: string) {
        this.headers[k] = v;
        return this;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.body = payload;
        return this;
      },
    };
    return res as typeof res & Response;
  }

  it("returns 401 without calling next when Bearer is missing", () => {
    const mw = requireBearerApiKey("expected-key");
    const req = { header: () => undefined } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    mw(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ error: "unauthorized" });
  });

  it("calls next when Bearer matches", () => {
    const mw = requireBearerApiKey("expected-key");
    const req = {
      header: (name: string) =>
        name.toLowerCase() === "authorization" ? "Bearer expected-key" : undefined,
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    mw(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });
});
