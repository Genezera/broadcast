import { describe, expect, it } from "vitest";
import {
  formatNational,
  isValidPhone,
  maxNationalDigits,
  phoneCountry,
  splitPhone,
  toInternational,
} from "./phone";

describe("phone", () => {
  it("formats the national part while typing", () => {
    expect(formatNational("BR", "11")).toBe("(11)");
    expect(formatNational("BR", "119")).toBe("(11) 9");
    expect(formatNational("BR", "11999991111")).toBe("(11) 99999-1111");
    expect(formatNational("US", "2133734253")).toBe("(213) 373-4253");
  });

  it("stores the international format with the country calling code", () => {
    expect(toInternational("BR", "11999991111")).toBe("+55 11 99999 1111");
    expect(toInternational("PT", "912345678")).toBe("+351 912 345 678");
    expect(toInternational("BR", "")).toBe("");
  });

  it("only uses characters accepted by the Firestore rule", () => {
    expect(toInternational("US", "2133734253")).toMatch(/^\+?[0-9 ()-]{8,24}$/);
    expect(toInternational("JP", "9012345678")).toMatch(/^\+?[0-9 ()-]{8,24}$/);
  });

  it("splits a stored phone into country and national digits", () => {
    expect(splitPhone("+55 11 99999-1111")).toEqual({
      country: "BR",
      digits: "11999991111",
    });
    expect(splitPhone("+351 912 345 678")).toEqual({
      country: "PT",
      digits: "912345678",
    });
    expect(splitPhone("")).toEqual({ country: "BR", digits: "" });
  });

  it("treats numbers without + as Brazilian (legacy data)", () => {
    expect(splitPhone("11999991111")).toEqual({
      country: "BR",
      digits: "11999991111",
    });
  });

  it("falls back to the first country that shares a calling code", () => {
    expect(phoneCountry("+1")).toBe("US");
  });

  it("validates numbers for the chosen country", () => {
    expect(isValidPhone("+55 11 99999-1111")).toBe(true);
    expect(isValidPhone("+55 (11) 99999-9999")).toBe(true);
    expect(isValidPhone("+55 11 9999")).toBe(false);
    expect(isValidPhone("abc")).toBe(false);
  });

  it("caps the national digits to the 15-digit E.164 limit", () => {
    expect(maxNationalDigits("BR")).toBe(13);
    expect(maxNationalDigits("PT")).toBe(12);
  });
});
