import { describe, expect, it } from "vitest";
import { sectionFromPath } from "./navigation";

describe("sectionFromPath", () => {
  it.each([
    ["/", "overview"],
    ["/connections", "connections"],
    ["/contacts", "contacts"],
    ["/broadcasts", "broadcasts"],
    ["/connections/abc123/contacts", "contacts"],
    ["/connections/abc123/broadcasts", "broadcasts"],
  ])("maps %s to %s", (path, section) => {
    expect(sectionFromPath(path)).toBe(section);
  });
});
