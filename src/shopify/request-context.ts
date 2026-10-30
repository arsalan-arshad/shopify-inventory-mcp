/**
 * Request-scoped Shopify config (hosted BYOK via headers).
 * Never log the stored config — it may contain secrets.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { ShopifyConfig } from "./types.js";

const shopifyConfigStorage = new AsyncLocalStorage<ShopifyConfig>();

/** Run `fn` with request-scoped Shopify credentials. */
export function runWithShopifyConfig<T>(
  config: ShopifyConfig,
  fn: () => T,
): T {
  return shopifyConfigStorage.run(config, fn);
}

/** Active request config, if any (hosted HTTP path). */
export function getRequestShopifyConfig(): ShopifyConfig | undefined {
  return shopifyConfigStorage.getStore();
}
