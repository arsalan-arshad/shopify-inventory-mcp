import { describe, expect, it } from "vitest";
import { shopifyConfigFromHeaders } from "../src/http/shopify-headers.js";
import { ShopifyError } from "../src/shopify/errors.js";
import {
  getRequestShopifyConfig,
  runWithShopifyConfig,
} from "../src/shopify/request-context.js";
import { shopifyConfigFromParts } from "../src/shopify/config.js";

function headers(map: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(map).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    get: (name: string) => lower[name.toLowerCase()],
  };
}

describe("shopifyConfigFromHeaders", () => {
  it("builds config from client id/secret headers", () => {
    const cfg = shopifyConfigFromHeaders(
      headers({
        "X-Shopify-Store-Domain": "Acme.myshopify.com",
        "X-Shopify-Client-Id": "id",
        "X-Shopify-Client-Secret": "secret",
      }),
    );
    expect(cfg.storeDomain).toBe("acme.myshopify.com");
    expect(cfg.clientId).toBe("id");
    expect(cfg.clientSecret).toBe("secret");
    expect(cfg.accessToken).toBeUndefined();
  });

  it("accepts admin access token instead of client credentials", () => {
    const cfg = shopifyConfigFromHeaders(
      headers({
        "x-shopify-store-domain": "acme",
        "x-shopify-admin-access-token": "shpat_test",
      }),
    );
    expect(cfg.storeDomain).toBe("acme.myshopify.com");
    expect(cfg.accessToken).toBe("shpat_test");
  });

  it("throws missing_shopify_headers when domain absent", () => {
    expect(() =>
      shopifyConfigFromHeaders(
        headers({
          "X-Shopify-Client-Id": "id",
          "X-Shopify-Client-Secret": "secret",
        }),
      ),
    ).toThrow(ShopifyError);
  });

  it("throws when neither token nor client pair present", () => {
    try {
      shopifyConfigFromHeaders(
        headers({ "X-Shopify-Store-Domain": "acme.myshopify.com" }),
      );
      expect.fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ShopifyError);
      expect((err as ShopifyError).code).toBe("missing_shopify_headers");
    }
  });
});

describe("request-context ALS", () => {
  it("exposes config only inside runWithShopifyConfig", () => {
    expect(getRequestShopifyConfig()).toBeUndefined();
    const cfg = shopifyConfigFromParts({
      storeDomain: "acme.myshopify.com",
      clientId: "id",
      clientSecret: "secret",
    });
    runWithShopifyConfig(cfg, () => {
      expect(getRequestShopifyConfig()?.storeDomain).toBe("acme.myshopify.com");
    });
    expect(getRequestShopifyConfig()).toBeUndefined();
  });
});
