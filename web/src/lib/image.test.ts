import { describe, expect, it } from "vitest";
import { squareCrop, validateImageFile } from "./image";

describe("validateImageFile", () => {
  it("accepts common image types within the size limit", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 1_000_000 })).toBeNull();
    expect(validateImageFile({ type: "image/png", size: 10 })).toBeNull();
    expect(validateImageFile({ type: "image/webp", size: 10 })).toBeNull();
  });

  it("rejects other file types", () => {
    expect(validateImageFile({ type: "application/pdf", size: 10 })).toBe(
      "Use uma imagem JPG, PNG ou WebP.",
    );
    expect(validateImageFile({ type: "image/svg+xml", size: 10 })).not.toBeNull();
  });

  it("rejects files above 5 MB", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 6 * 1024 * 1024 })).toBe(
      "A imagem deve ter no máximo 5 MB.",
    );
  });
});

describe("squareCrop", () => {
  it("centers the crop on landscape images", () => {
    expect(squareCrop(400, 200)).toEqual({ sx: 100, sy: 0, size: 200 });
  });

  it("centers the crop on portrait images", () => {
    expect(squareCrop(200, 500)).toEqual({ sx: 0, sy: 150, size: 200 });
  });

  it("keeps square images untouched", () => {
    expect(squareCrop(300, 300)).toEqual({ sx: 0, sy: 0, size: 300 });
  });
});
