/**
 * Defaults taken from Agent Forecast `forecasting.js` and the README example.
 * Keep in sync with the vendor-copied math and fixture expectations.
 */

/** Default window for standalone `weightedMovingAverage` calls. */
export const WMA_DEFAULT_PERIODS = 4;

/**
 * Window used inside `calculateReorderPoint` when computing avg daily usage.
 * (Hard-coded as 14 in forecasting.js — not the standalone default of 4.)
 */
export const REORDER_POINT_WMA_PERIODS = 14;

/** Service-level z-score (~95%). forecasting.js default. */
export const DEFAULT_SERVICE_LEVEL_Z = 1.65;

/**
 * Store-wide lead time (days) used in the README worked example.
 * v0: store-wide only (env / tool param). Per-SKU overrides are v1.
 */
export const DEFAULT_LEAD_TIME_DAYS = 21;

/**
 * Default cap for `list_at_risk_skus` so model context is not flooded.
 */
export const DEFAULT_LIST_AT_RISK_LIMIT = 50;

/**
 * Multi-location stock: match Agent Forecast loaders
 * (`forecast-snapshot.server.js`) — sum `available` across locations
 * (up to 10 levels fetched per item in the app).
 */
export const MULTI_LOCATION_STOCK_POLICY = "sum_available" as const;
