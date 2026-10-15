import { describe, expect, it } from "vitest";
import { firstName, initialOf, resolveDisplayName } from "./displayName";

describe("resolveDisplayName", () => {
  const user = { displayName: "Nome do Auth", email: "ana.souza@exemplo.com" };

  it("prefers the profile name, then the Auth name, then the e-mail", () => {
    expect(resolveDisplayName({ name: "Ana Souza" }, user)).toBe("Ana Souza");
    expect(resolveDisplayName({ name: "  " }, user)).toBe("Nome do Auth");
    expect(resolveDisplayName(null, { email: "ana.souza@exemplo.com" })).toBe(
      "ana.souza",
    );
  });

  it("has a last-resort fallback", () => {
    expect(resolveDisplayName(undefined, {}, "Usuário")).toBe("Usuário");
    expect(resolveDisplayName(undefined, {})).toBe("User");
  });
});

describe("name helpers", () => {
  it("extracts the first name and the initial", () => {
    expect(firstName("  Ana Paula Souza ")).toBe("Ana");
    expect(initialOf("ana")).toBe("A");
    expect(initialOf("")).toBe("U");
  });
});
