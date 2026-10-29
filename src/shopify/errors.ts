/**
 * Shopify read-layer errors. Never include tokens or secrets in messages.
 */

export class ShopifyError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ShopifyError";
    this.code = code;
    this.status = status;
  }
}

export function redactSecrets(text: string): string {
  return text
    .replace(/shpat_[A-Za-z0-9]+/g, "shpat_[REDACTED]")
    .replace(/shpss_[A-Za-z0-9]+/g, "shpss_[REDACTED]")
    .replace(/shpca_[A-Za-z0-9]+/g, "shpca_[REDACTED]")
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/X-Shopify-Access-Token:\s*\S+/gi, "X-Shopify-Access-Token: [REDACTED]");
}
