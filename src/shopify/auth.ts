import { ShopifyError, redactSecrets } from "./errors.js";
import type { ShopifyConfig } from "./types.js";

type TokenCache = {
  accessToken: string;
  /** epoch ms when the token should be refreshed */
  expiresAtMs: number;
};

let cache: TokenCache | null = null;

/** Test helper — clear client-credentials cache between tests. */
export function clearAccessTokenCache(): void {
  cache = null;
}

/**
 * Resolve a usable Admin API access token.
 * Prefers a static SHOPIFY_ADMIN_ACCESS_TOKEN when set; otherwise exchanges
 * Dev Dashboard client credentials (24h lifetime).
 */
export async function resolveAccessToken(
  config: ShopifyConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  if (config.accessToken) {
    return config.accessToken;
  }

  if (!config.clientId || !config.clientSecret) {
    throw new ShopifyError(
      "No Admin API credentials configured",
      "missing_credentials",
    );
  }

  const now = Date.now();
  // Refresh 5 minutes early.
  if (cache && cache.expiresAtMs - 5 * 60_000 > now) {
    return cache.accessToken;
  }

  const url = `https://${config.storeDomain}/admin/oauth/access_token`;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ShopifyError(
      `Failed to request access token: ${redactSecrets(msg)}`,
      "token_network_error",
    );
  }

  if (!response.ok) {
    const body = redactSecrets(await response.text().catch(() => ""));
    throw new ShopifyError(
      `Client-credentials token request failed (${response.status}): ${body.slice(0, 200)}`,
      "token_http_error",
      response.status,
    );
  }

  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!json.access_token) {
    throw new ShopifyError(
      "Token response missing access_token",
      "token_invalid_response",
    );
  }

  const expiresInSec = json.expires_in ?? 86_399;
  cache = {
    accessToken: json.access_token,
    expiresAtMs: now + expiresInSec * 1000,
  };
  return json.access_token;
}
