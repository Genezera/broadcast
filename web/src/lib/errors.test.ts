import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./errors";

describe("getErrorMessage", () => {
  it("translates authentication errors", () => {
    expect(getErrorMessage({ code: "auth/invalid-credential" })).toBe(
      "E-mail ou senha incorretos.",
    );
    expect(getErrorMessage({ code: "auth/email-already-in-use" })).toBe(
      "Este e-mail já está cadastrado.",
    );
  });

  it("maps Firestore and Functions permission errors", () => {
    const expected = "Você não tem permissão para realizar esta ação.";
    expect(getErrorMessage({ code: "permission-denied" })).toBe(expected);
    expect(getErrorMessage({ code: "functions/permission-denied" })).toBe(expected);
  });

  it("keeps the backend message for validation failures", () => {
    expect(
      getErrorMessage({
        code: "functions/invalid-argument",
        message: "A mensagem não pode ficar vazia.",
      }),
    ).toBe("A mensagem não pode ficar vazia.");
  });

  it("never leaks raw internal messages", () => {
    expect(
      getErrorMessage({ code: "functions/internal", message: "INTERNAL" }),
    ).toBe("Não foi possível concluir a operação. Tente novamente.");
    expect(getErrorMessage(new Error("boom"))).toBe(
      "Não foi possível concluir a operação. Tente novamente.",
    );
    expect(getErrorMessage(undefined)).toContain("Não foi possível");
  });
});
