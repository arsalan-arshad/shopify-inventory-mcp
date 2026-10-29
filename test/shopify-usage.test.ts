import { describe, expect, it } from "vitest";
import {
  denseDailyHistory,
  historyTooShort,
} from "../src/shopify/usage.js";

describe("denseDailyHistory", () => {
  it("fills gaps with zero, oldest first", () => {
    const usage = new Map([
      [
        "SKU-A",
        new Map([
          ["2026-10-26", 3],
          ["2026-10-28", 5],
        ]),
      ],
    ]);
    const now = new Date(Date.UTC(2026, 9, 28)); // Oct 28
    const { history, dataRange } = denseDailyHistory(usage, "SKU-A", 3, now);
    expect(history).toEqual([3, 0, 5]);
    expect(dataRange.from).toBe("2026-10-26");
    expect(dataRange.to).toBe("2026-10-28");
    expect(dataRange.dayCount).toBe(3);
  });

  it("returns all zeros for unknown SKU", () => {
    const { history } = denseDailyHistory(new Map(), "MISSING", 5, new Date());
    expect(history).toEqual([0, 0, 0, 0, 0]);
  });
});

describe("historyTooShort", () => {
  it("flags sparse history", () => {
    expect(historyTooShort([1, 0, 0, 0, 0, 0, 0, 0])).toBe(true);
    expect(historyTooShort([1, 1, 1, 1, 1, 1, 1])).toBe(false);
  });
});
