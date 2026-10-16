import { describe, expect, it } from "vitest";
import {
  hasFormatting,
  parseFormatting,
  stripFormatting,
  toggleFormat,
} from "./formatting";

describe("parseFormatting", () => {
  it("reads bold, italic, underline and strikethrough", () => {
    expect(parseFormatting("*oi*")).toEqual([
      { marker: "*", children: ["oi"] },
    ]);
    expect(parseFormatting("_oi_")).toEqual([
      { marker: "_", children: ["oi"] },
    ]);
    expect(parseFormatting("__oi__")).toEqual([
      { marker: "__", children: ["oi"] },
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

  it("ignores markers that are not wrapped around text", () => {
    for (const text of [
      "2 * 3 * 4",
      "snake_case_name",
      "*sem fechar",
      "* *",
      "preço ~ 10",
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
    expect(stripFormatting("*Promoção* de _hoje_: __até__ ~ontem~")).toBe(
      "Promoção de hoje: até ontem",
    );
  });
});

describe("toggleFormat", () => {
  it("wraps the selection", () => {
    expect(toggleFormat("olá mundo", 4, 9, "*")).toEqual({
      value: "olá *mundo*",
      start: 5,
      end: 10,
    });
  });

  it("opens a pair with the cursor in the middle when nothing is selected", () => {
    expect(toggleFormat("olá ", 4, 4, "__")).toEqual({
      value: "olá ____",
      start: 6,
      end: 6,
    });
  });

  it("keeps spaces at the edges outside the markers", () => {
    expect(toggleFormat("a  b  c", 1, 6, "_").value).toBe("a  _b_  c");
  });

  it("removes the markers when the selection is already styled", () => {
    expect(toggleFormat("olá *mundo*", 5, 10, "*")).toEqual({
      value: "olá mundo",
      start: 4,
      end: 9,
    });
    expect(toggleFormat("olá *mundo*", 4, 11, "*")).toEqual({
      value: "olá mundo",
      start: 4,
      end: 9,
    });
  });
});
