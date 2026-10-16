import { describe, expect, it } from "vitest";
import {
  docToMarkers,
  hasFormatting,
  markersToDoc,
  parseFormatting,
  stripFormatting,
} from "./formatting";

describe("parseFormatting", () => {
  it("reads bold, italic, underline and strikethrough", () => {
    expect(parseFormatting("*oi*")).toEqual([
      { marker: "*", children: ["oi"] },
    ]);
    expect(parseFormatting("_oi_")).toEqual([
      { marker: "_", children: ["oi"] },
    ]);
    expect(parseFormatting("++oi++")).toEqual([
      { marker: "++", children: ["oi"] },
    ]);
    expect(parseFormatting("~oi~")).toEqual([
      { marker: "~", children: ["oi"] },
    ]);
  });

  it("keeps plain text around and nests styles", () => {
    expect(parseFormatting("olá *muito _bom_* dia")).toEqual([
      "olá ",
      {
        marker: "*",
        children: ["muito ", { marker: "_", children: ["bom"] }],
      },
      " dia",
    ]);
  });

  it("combines underline with italic without ambiguity", () => {
    expect(parseFormatting("++_oi_++")).toEqual([
      {
        marker: "++",
        children: [{ marker: "_", children: ["oi"] }],
      },
    ]);
  });

  it("ignores markers that are not wrapped around text", () => {
    for (const text of [
      "2 * 3 * 4",
      "snake_case_name",
      "*sem fechar",
      "* *",
      "preço ~ 10",
      "C++ e C++ puro",
      "a ++ b ++ c",
    ]) {
      expect(hasFormatting(text), text).toBe(false);
      expect(stripFormatting(text)).toBe(text);
    }
  });

  it("does not cross lines", () => {
    expect(hasFormatting("*linha 1\nlinha 2*")).toBe(false);
  });

  it("never produces markup: tags stay as plain text", () => {
    expect(parseFormatting("<b>oi</b>")).toEqual(["<b>oi</b>"]);
  });
});

describe("stripFormatting", () => {
  it("removes the markers and keeps the text", () => {
    expect(stripFormatting("*Promoção* de _hoje_: ++até++ ~ontem~")).toBe(
      "Promoção de hoje: até ontem",
    );
  });
});

describe("editor document conversion", () => {
  const text = (value: string, ...marks: string[]) => ({
    type: "text",
    text: value,
    ...(marks.length > 0 && { marks: marks.map((type) => ({ type })) }),
  });

  it("turns markers into styled text, one paragraph per line", () => {
    expect(markersToDoc("Olá *você*\n\n_fim_")).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [text("Olá "), text("você", "bold")],
        },
        { type: "paragraph" },
        { type: "paragraph", content: [text("fim", "italic")] },
      ],
    });
  });

  it("turns styled text back into markers", () => {
    expect(
      docToMarkers({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              text("a "),
              text("forte", "bold"),
              text(" e "),
              text("sublinhado itálico", "underline", "italic"),
            ],
          },
          { type: "paragraph" },
          { type: "paragraph", content: [text("riscado", "strike")] },
        ],
      }),
    ).toBe("a *forte* e ++_sublinhado itálico_++\n\n~riscado~");
  });

  it("keeps spaces outside the markers so the style still applies", () => {
    expect(
      docToMarkers({
        type: "doc",
        content: [
          { type: "paragraph", content: [text(" oi ", "bold"), text("!")] },
        ],
      }),
    ).toBe(" *oi* !");
    // Só espaço estilizado não vira marcador.
    expect(
      docToMarkers({
        type: "doc",
        content: [{ type: "paragraph", content: [text("  ", "bold")] }],
      }),
    ).toBe("  ");
  });

  it("round-trips formatted messages", () => {
    for (const original of [
      "Oi *tudo* bem?",
      "++_junto_++ e *~outro~*",
      "linha 1\n\nlinha 3 com _itálico_",
      "sem estilo nenhum",
      "",
    ]) {
      expect(docToMarkers(markersToDoc(original))).toBe(original);
    }
  });
});
