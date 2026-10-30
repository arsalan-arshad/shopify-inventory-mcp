/**
 * Parse per-request Shopify BYOK credentials from HTTP headers.
 * Never log header values — they may contain secrets.
 */

import {
  shopifyConfigFromParts,
  DEFAULT_API_VERSION,
  DEFAULT_HISTORY_DAYS,
  DEFAULT_MAX_INVENTORY_ITEMS,
  DEFAULT_MAX_ORDER_PAGES,
} from "../shopify/config.js";
import { DEFAULT_LEAD_TIME_DAYS } from "../forecast/defaults.js";
import { ShopifyError } from "../shopify/errors.js";
import type { ShopifyConfig } from "../shopify/types.js";

export const SHOPIFY_HEADER = {
  storeDomain: "x-shopify-store-domain",
  clientId: "x-shopify-client-id",
  clientSecret: "x-shopify-client-secret",
  accessToken: "x-shopify-admin-access-token",
  apiVersion: "x-shopify-api-version",
  leadTimeDays: "x-shopify-lead-time-days",
} as const;

export type HeaderBag = {
  get(name: string): string | undefined;
};

function header(
  source: HeaderBag,
  name: string,
): string | undefined {
  // Express normalizes to lowercase; also try as-given for tests.
  const v = source.get(name) ?? source.get(name.toLowerCase());
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Build ShopifyConfig from request headers.
 * Required: store domain + (client id/secret OR admin access token).
 */
export function shopifyConfigFromHeaders(source: HeaderBag): ShopifyConfig {
  const storeDomain = header(source, SHOPIFY_HEADER.storeDomain);
  if (!storeDomain) {
    throw new ShopifyError(
      `Missing ${SHOPIFY_HEADER.storeDomain} header (your-store.myshopify.com)`,
      "missing_shopify_headers",
    );
  }

  const accessToken = header(source, SHOPIFY_HEADER.accessToken);
  const clientId = header(source, SHOPIFY_HEADER.clientId);
  const clientSecret = header(source, SHOPIFY_HEADER.clientSecret);

  if (!accessToken && !(clientId && clientSecret)) {
    throw new ShopifyError(
      `Provide ${SHOPIFY_HEADER.accessToken}, or both ${SHOPIFY_HEADER.clientId} and ${SHOPIFY_HEADER.clientSecret}`,
      "missing_shopify_headers",
    );
  }

  const leadRaw = header(source, SHOPIFY_HEADER.leadTimeDays);
  let leadTimeDays = DEFAULT_LEAD_TIME_DAYS;
  if (leadRaw) {
    const n = Number(leadRaw);
    if (Number.isFinite(n) && n > 0) leadTimeDays = Math.floor(n);
  }

  return shopifyConfigFromParts({
    storeDomain,
    accessToken,
    clientId,
    clientSecret,
    apiVersion: header(source, SHOPIFY_HEADER.apiVersion) ?? DEFAULT_API_VERSION,
    leadTimeDays,
    historyDays: DEFAULT_HISTORY_DAYS,
    maxInventoryItems: DEFAULT_MAX_INVENTORY_ITEMS,
    maxOrderPages: DEFAULT_MAX_ORDER_PAGES,
  });
}
