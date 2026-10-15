import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FLAT_DICTIONARIES } from "./translate";

/**
 * As Cloud Functions devolvem uma chave estável em `details.key` e o app
 * traduz. Este teste garante que toda chave do backend tem texto nos dois
 * idiomas (e vice-versa), com os mesmos {placeholders}.
 */
const source = readFileSync(
  new URL("../../../functions/src/shared/errors.ts", import.meta.url),
  "utf8",
);
const block = source.slice(
  source.indexOf("const MESSAGES = {"),
  source.indexOf("} as const;"),
);
const backend = Object.fromEntries(
  [...block.matchAll(/^\s+(\w+):\s*\n?\s*"([^"]+)"/gm)].map((m) => [
    m[1],
    m[2],
  ]),
);

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("server error keys", () => {
  it("reads the backend catalogue", () => {
    expect(Object.keys(backend).length).toBeGreaterThan(10);
  });

  for (const lang of ["pt", "en"] as const) {
    const dictionary = FLAT_DICTIONARIES[lang];
    const translated = Object.keys(dictionary)
      .filter((key) => key.startsWith("errors.server."))
      .map((key) => key.replace("errors.server.", ""));

    it(`has every backend key translated (${lang})`, () => {
      expect(translated.sort()).toEqual(Object.keys(backend).sort());
    });

    it(`uses the backend placeholders (${lang})`, () => {
      for (const [key, message] of Object.entries(backend)) {
        expect(placeholders(dictionary[`errors.server.${key}`]), key).toEqual(
          placeholders(message),
        );
      }
    });
  }
});
