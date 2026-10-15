import { describe, expect, it } from "vitest";
import { translators } from "../i18n/translate";
import { getErrorMessage } from "./errors";

const pt = translators.pt;
const en = translators.en;

describe("getErrorMessage", () => {
  it("translates authentication errors", () => {
    expect(getErrorMessage({ code: "auth/invalid-credential" }, pt)).toBe(
      "E-mail ou senha incorretos.",
    );
    expect(getErrorMessage({ code: "auth/email-already-in-use" }, pt)).toBe(
      "Este e-mail já está cadastrado.",
    );
  });

  it("answers in the language of the translator", () => {
    expect(getErrorMessage({ code: "auth/invalid-credential" }, en)).toBe(
      "Incorrect e-mail or password.",
    );
    expect(getErrorMessage(undefined, en)).toContain("couldn't complete");
  });

  it("maps Firestore and Functions permission errors", () => {
    const expected = "Você não tem permissão para realizar esta ação.";
    expect(getErrorMessage({ code: "permission-denied" }, pt)).toBe(expected);
    expect(getErrorMessage({ code: "functions/permission-denied" }, pt)).toBe(
      expected,
    );
  });

  it("translates the key sent by the Cloud Functions, with parameters", () => {
    const error = {
      code: "functions/invalid-argument",
      message: "A mensagem deve ter no máximo 2000 caracteres.",
      details: { key: "bodyTooLong", params: { max: 2000 } },
    };
    expect(getErrorMessage(error, pt)).toBe(
      "A mensagem deve ter no máximo 2000 caracteres.",
    );
    expect(getErrorMessage(error, en)).toBe(
      "The message must have at most 2000 characters.",
    );
  });

  it("falls back to the function message when the key is unknown", () => {
    expect(
      getErrorMessage(
        {
          code: "functions/invalid-argument",
          message: "A mensagem não pode ficar vazia.",
        },
        pt,
      ),
    ).toBe("A mensagem não pode ficar vazia.");
  });

  it("never leaks raw internal messages", () => {
    expect(
      getErrorMessage({ code: "functions/internal", message: "INTERNAL" }, pt),
    ).toBe("Não foi possível concluir a operação. Tente novamente.");
    expect(getErrorMessage(new Error("boom"), pt)).toBe(
      "Não foi possível concluir a operação. Tente novamente.",
    );
  });
});
