import { describe, expect, it } from "vitest";
import { isFuture, localInputToIso, toLocalInputValue } from "./dates";

describe("dates", () => {
  it("round-trips a local datetime-local value to an absolute UTC instant", () => {
    // O fuso de teste é America/Sao_Paulo (UTC-3), definido em vite.config.ts.
    expect(localInputToIso("2026-10-15T18:00")).toBe("2026-10-15T21:00:00.000Z");
    expect(toLocalInputValue(new Date("2026-10-15T21:00:00.000Z"))).toBe(
      "2026-10-15T18:00",
    );
  });

  it("pads single-digit parts", () => {
    expect(toLocalInputValue(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05T07:03");
  });

  it("detects future values and rejects invalid ones", () => {
    const now = Date.parse("2026-10-15T21:00:00Z");
    expect(isFuture("2026-10-15T18:01", now)).toBe(true);
    expect(isFuture("2026-10-15T18:00", now)).toBe(false);
    expect(isFuture("", now)).toBe(false);
  });
});
