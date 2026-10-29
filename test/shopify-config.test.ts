import { describe, expect, it } from "vitest";
import {
  loadShopifyConfig,
  normalizeStoreDomain,
} from "../src/shopify/config.js";
import { ShopifyError } from "../src/shopify/errors.js";

describe("normalizeStoreDomain", () => {
  it("adds myshopify.com when bare subdomain", () => {
    expect(normalizeStoreDomain("Acme-Store")).toBe("acme-store.myshopify.com");
  });

  it("strips protocol and trailing slash", () => {
    expect(normalizeStoreDomain("https://acme.myshopify.com/")).toBe(
      "acme.myshopify.com",
    );
  });
});

describe("loadShopifyConfig", () => {
  it("requires store domain", () => {
    expect(() =>
      loadShopifyConfig({
        SHOPIFY_ADMIN_ACCESS_TOKEN: "shpat_x",
      }),
    ).toThrow(ShopifyError);
  });

  it("accepts static token", () => {
    const cfg = loadShopifyConfig({
      SHOPIFY_STORE_DOMAIN: "acme.myshopify.com",
      SHOPIFY_ADMIN_ACCESS_TOKEN: "shpat_test",
      LEAD_TIME_DAYS: "14",
    });
    expect(cfg.storeDomain).toBe("acme.myshopify.com");
    expect(cfg.accessToken).toBe("shpat_test");
    expect(cfg.leadTimeDays).toBe(14);
  });

  it("accepts client credentials without static token", () => {
    const cfg = loadShopifyConfig({
      SHOPIFY_STORE_DOMAIN: "acme",
      SHOPIFY_CLIENT_ID: "id",
      SHOPIFY_CLIENT_SECRET: "secret",
    });
    expect(cfg.storeDomain).toBe("acme.myshopify.com");
    expect(cfg.clientId).toBe("id");
    expect(cfg.accessToken).toBeUndefined();
  });

  it("rejects missing credentials", () => {
    expect(() =>
      loadShopifyConfig({ SHOPIFY_STORE_DOMAIN: "acme.myshopify.com" }),
    ).toThrow(/CLIENT_ID|ACCESS_TOKEN/);
  });
});
