import { describe, expect, it } from "vitest";
import { byName } from "./sorting";

describe("byName", () => {
  it("sorts in pt-BR order ignoring case and accents", () => {
    const names = ["zélia", "Ana", "álvaro", "bruno"].map((name) => ({ name }));
    expect(byName(names).map((item) => item.name)).toEqual([
      "álvaro",
      "Ana",
      "bruno",
      "zélia",
    ]);
  });

  it("does not mutate the original list", () => {
    const items = [{ name: "b" }, { name: "a" }];
    byName(items);
    expect(items[0].name).toBe("b");
  });
});
