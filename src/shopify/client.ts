import { resolveAccessToken } from "./auth.js";
import { ShopifyError, redactSecrets } from "./errors.js";
import type { ShopifyConfig } from "./types.js";

export type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
  extensions?: {
    cost?: {
      throttleStatus?: {
        currentlyAvailable?: number;
        restoreRate?: number;
        maximumAvailable?: number;
      };
    };
  };
};

export type ShopifyClient = {
  graphql: <T>(
    query: string,
    variables?: Record<string, unknown>,
  ) => Promise<GraphqlResponse<T>>;
};

const MAX_RETRIES = 4;

/**
 * Create a GraphQL Admin API client for the given config.
 * Retries on HTTP 429 and GraphQL THROTTLED with exponential backoff.
 */
export function createShopifyClient(
  config: ShopifyConfig,
  fetchImpl: typeof fetch = fetch,
): ShopifyClient {
  return {
    async graphql<T>(
      query: string,
      variables: Record<string, unknown> = {},
    ): Promise<GraphqlResponse<T>> {
      let lastError: unknown;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          return await graphqlOnce<T>(config, query, variables, fetchImpl);
        } catch (err) {
          lastError = err;
          if (
            err instanceof ShopifyError &&
            (err.code === "throttled" || err.status === 429) &&
            attempt < MAX_RETRIES
          ) {
            const delayMs = Math.min(1000 * 2 ** attempt, 8000);
            await sleep(delayMs);
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    },
  };
}

async function graphqlOnce<T>(
  config: ShopifyConfig,
  query: string,
  variables: Record<string, unknown>,
  fetchImpl: typeof fetch,
): Promise<GraphqlResponse<T>> {
  const token = await resolveAccessToken(config, fetchImpl);
  const url = `https://${config.storeDomain}/admin/api/${config.apiVersion}/graphql.json`;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ShopifyError(
      `Shopify GraphQL network error: ${redactSecrets(msg)}`,
      "network_error",
    );
  }

  if (response.status === 429) {
    throw new ShopifyError("Shopify rate limit (HTTP 429)", "throttled", 429);
  }

  if (!response.ok) {
    const body = redactSecrets(await response.text().catch(() => ""));
    throw new ShopifyError(
      `Shopify GraphQL HTTP ${response.status}: ${body.slice(0, 200)}`,
      "http_error",
      response.status,
    );
  }

  const json = (await response.json()) as GraphqlResponse<T>;

  const throttled = json.errors?.some(
    (e) => e.extensions?.code === "THROTTLED" || /throttl/i.test(e.message),
  );
  if (throttled) {
    throw new ShopifyError("Shopify GraphQL THROTTLED", "throttled", 429);
  }

  if (json.errors?.length && !json.data) {
    const msg = redactSecrets(
      json.errors.map((e) => e.message).join("; ").slice(0, 300),
    );
    throw new ShopifyError(`Shopify GraphQL error: ${msg}`, "graphql_error");
  }

  return json;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
