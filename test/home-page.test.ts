import { describe, expect, it } from "vitest";
import { renderHomePage } from "../src/http/home-page.js";

describe("renderHomePage", () => {
  it("includes brand, both run modes, and escaped origin mcp url", () => {
    const html = renderHomePage(
      { name: "shopify-inventory-mcp", version: "0.2.3" },
      "https://example.up.railway.app",
    );
    expect(html).toContain("shopify-inventory-mcp");
    expect(html).toContain("0.2.3");
    expect(html).toContain("Local (stdio BYOK)");
    expect(html).toContain("Hosted (this server)");
    expect(html).toContain("https://example.up.railway.app/mcp");
    expect(html).toContain("X-Shopify-Store-Domain");
    expect(html).not.toContain("<script>");
  });
});
