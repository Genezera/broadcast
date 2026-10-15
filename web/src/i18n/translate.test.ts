import { describe, expect, it } from "vitest";
import { createTranslator, FLAT_DICTIONARIES } from "./translate";

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("dictionaries", () => {
  const pt = FLAT_DICTIONARIES.pt;
  const en = FLAT_DICTIONARIES.en;

  it("have exactly the same keys in both languages", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(pt).sort());
  });

  it("use the same {placeholders} in both languages", () => {
    for (const key of Object.keys(pt)) {
      expect(placeholders(en[key]), key).toEqual(placeholders(pt[key]));
    }
  });

  it("have no empty texts", () => {
    for (const [key, value] of [...Object.entries(pt), ...Object.entries(en)]) {
      expect(value.trim().length, key).toBeGreaterThan(0);
    }
  });

  it("always define plurals as a _one/_other pair", () => {
    for (const dictionary of [pt, en]) {
      for (const key of Object.keys(dictionary)) {
        if (key.endsWith("_one")) {
          expect(dictionary[key.replace(/_one$/, "_other")], key).toBeDefined();
        }
        if (key.endsWith("_other")) {
          expect(dictionary[key.replace(/_other$/, "_one")], key).toBeDefined();
        }
      }
    }
  });

  it("translate the app name and tagline differently per language", () => {
    expect(pt["meta.title"]).not.toBe(en["meta.title"]);
  });
});

describe("createTranslator", () => {
  const t = createTranslator("pt");
  const en = createTranslator("en");

  it("interpolates params", () => {
    expect(t("contacts.editAria", { name: "Ana" })).toContain("Ana");
    expect(en("contacts.editAria", { name: "Ana" })).toContain("Ana");
  });

  it("keeps an unknown placeholder visible instead of crashing", () => {
    expect(t("contacts.editAria", {})).toContain("{name}");
  });

  it("picks singular and plural by count", () => {
    expect(t("contacts.count", { count: 1, connection: "Loja" })).toBe(
      "1 contato em Loja",
    );
    expect(t("contacts.count", { count: 3, connection: "Loja" })).toBe(
      "3 contatos em Loja",
    );
    expect(en("contacts.count", { count: 1, connection: "Shop" })).toBe(
      "1 contact in Shop",
    );
    expect(en("contacts.count", { count: 2, connection: "Shop" })).toBe(
      "2 contacts in Shop",
    );
  });

  it("returns the key for unknown paths and undefined from maybe()", () => {
    expect(t.maybe("nope.nothing")).toBeUndefined();
    expect(t("nope.nothing" as never)).toBe("nope.nothing");
  });

  it("exposes its language", () => {
    expect(t.lang).toBe("pt");
    expect(en.lang).toBe("en");
  });
});
