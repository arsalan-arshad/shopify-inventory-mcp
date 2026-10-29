import { DEFAULT_LEAD_TIME_DAYS } from "../forecast/defaults.js";
import { ShopifyError } from "./errors.js";
import type { ShopifyConfig } from "./types.js";

/** Matches Agent Forecast usage-history window. */
export const DEFAULT_HISTORY_DAYS = 30;

/** Matches Agent Forecast snapshot safety cap. */
export const DEFAULT_MAX_INVENTORY_ITEMS = 2000;

/**
 * Order pagination budget for v0. 50 orders/page × 24 pages ≈ 1200 orders —
 * enough for many stores within the 60-day `read_orders` window without bulk ops.
 */
export const DEFAULT_MAX_ORDER_PAGES = 24;

export const DEFAULT_API_VERSION = "2025-10";

/**
 * Load config from process.env (BYOK). Supports:
 * - Static token: SHOPIFY_ADMIN_ACCESS_TOKEN (existing admin-created custom apps)
 * - Client credentials: SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (Dev Dashboard)
 */
export function loadShopifyConfig(
  env: NodeJS.ProcessEnv = process.env,
): ShopifyConfig {
  const rawDomain = (env.SHOPIFY_STORE_DOMAIN ?? "").trim();
  if (!rawDomain) {
    throw new ShopifyError(
      "SHOPIFY_STORE_DOMAIN is required (e.g. your-store.myshopify.com)",
      "missing_store_domain",
    );
  }

  const storeDomain = normalizeStoreDomain(rawDomain);
  const accessToken = emptyToUndefined(env.SHOPIFY_ADMIN_ACCESS_TOKEN);
  const clientId = emptyToUndefined(env.SHOPIFY_CLIENT_ID);
  const clientSecret = emptyToUndefined(env.SHOPIFY_CLIENT_SECRET);

  if (!accessToken && !(clientId && clientSecret)) {
    throw new ShopifyError(
      "Provide SHOPIFY_ADMIN_ACCESS_TOKEN, or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET",
      "missing_credentials",
    );
  }

  return {
    storeDomain,
    accessToken,
    clientId,
    clientSecret,
    apiVersion: emptyToUndefined(env.SHOPIFY_API_VERSION) ?? DEFAULT_API_VERSION,
    leadTimeDays: parsePositiveInt(
      env.LEAD_TIME_DAYS,
      DEFAULT_LEAD_TIME_DAYS,
    ),
    historyDays: parsePositiveInt(env.HISTORY_DAYS, DEFAULT_HISTORY_DAYS),
    maxInventoryItems: parsePositiveInt(
      env.MAX_INVENTORY_ITEMS,
      DEFAULT_MAX_INVENTORY_ITEMS,
    ),
    maxOrderPages: parsePositiveInt(
      env.MAX_ORDER_PAGES,
      DEFAULT_MAX_ORDER_PAGES,
    ),
  };
}

export function normalizeStoreDomain(domain: string): string {
  let d = domain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/\/$/, "");
  if (!d.includes(".")) {
    d = `${d}.myshopify.com`;
  }
  return d;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}
