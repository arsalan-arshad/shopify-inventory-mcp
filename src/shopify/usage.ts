import type { DailyUsageBySku, DataRange } from "./types.js";

/**
 * Build a dense oldest-first daily usage array for a SKU (gap-fill with 0),
 * matching Agent Forecast `getUsageHistory`.
 */
export function denseDailyHistory(
  usageBySku: DailyUsageBySku,
  sku: string,
  days: number,
  now: Date = new Date(),
): { history: number[]; dataRange: DataRange } {
  const byDay = usageBySku.get(sku) ?? new Map<string, number>();
  const end = startOfUtcDay(now);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const history: number[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = toIsoDate(cursor);
    history.push(byDay.get(key) ?? 0);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    history,
    dataRange: {
      from: toIsoDate(start),
      to: toIsoDate(end),
      dayCount: history.length,
    },
  };
}

export function historyTooShort(
  history: number[],
  minNonZeroDays = 7,
): boolean {
  const nonZero = history.filter((n) => n > 0).length;
  return nonZero < minNonZeroDays;
}

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
