import { describe, expect, it } from "vitest";
import { translators } from "../../i18n/translate";
import { changePasswordSchema, profileSchema } from "./schemas";

const t = translators.pt;

const issues = (
  schema: ReturnType<typeof changePasswordSchema>,
  values: unknown,
) => {
  const result = schema.safeParse(values);
  return result.success ? [] : result.error.issues.map((item) => item.message);
};

describe("profileSchema", () => {
  it("trims and validates the name", () => {
    expect(profileSchema(t).parse({ name: "  Ana Souza  " }).name).toBe(
      "Ana Souza",
    );
    expect(profileSchema(t).safeParse({ name: "A" }).success).toBe(false);
    expect(profileSchema(t).safeParse({ name: "x".repeat(61) }).success).toBe(
      false,
    );
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "senha-atual",
    newPassword: "senha-nova-1",
    confirmPassword: "senha-nova-1",
  };

  it("accepts a valid change", () => {
    expect(issues(changePasswordSchema(t), valid)).toEqual([]);
  });

  it("requires the confirmation to match", () => {
    expect(
      issues(changePasswordSchema(t), { ...valid, confirmPassword: "outra" }),
    ).toContain("As senhas não conferem.");
  });

  it("requires a different and long enough new password", () => {
    expect(
      issues(changePasswordSchema(t), {
        ...valid,
        newPassword: "senha-atual",
        confirmPassword: "senha-atual",
      }),
    ).toContain("A nova senha deve ser diferente da atual.");
    expect(
      issues(changePasswordSchema(t), {
        ...valid,
        newPassword: "123",
        confirmPassword: "123",
      }),
    ).toContain("A senha deve ter pelo menos 6 caracteres.");
  });
});
