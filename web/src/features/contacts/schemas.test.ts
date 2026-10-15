import { describe, expect, it } from "vitest";
import { contactSchema } from "./schemas";

describe("contactSchema", () => {
  it("accepts common phone formats and trims values", () => {
    const parsed = contactSchema.parse({
      name: "  Maria  ",
      phone: " +55 (11) 99999-9999 ",
    });
    expect(parsed).toEqual({ name: "Maria", phone: "+55 (11) 99999-9999" });
  });

  it("rejects empty names and malformed phones", () => {
    expect(
      contactSchema.safeParse({ name: " ", phone: "11999999999" }).success,
    ).toBe(false);
    expect(contactSchema.safeParse({ name: "Ana", phone: "abc" }).success).toBe(
      false,
    );
    expect(contactSchema.safeParse({ name: "Ana", phone: "123" }).success).toBe(
      false,
    );
  });
});
