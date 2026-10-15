import { z } from "zod";
import type { Translator } from "../../i18n/translate";

// Os schemas são funções do tradutor: as mensagens de validação aparecem no
// idioma escolhido (os componentes recriam o schema quando o idioma muda).

export const emailSchema = (t: Translator) =>
  z
    .string()
    .trim()
    .min(1, t("auth.validation.emailRequired"))
    .email(t("auth.validation.emailInvalid"));

/** Nome de exibição do cliente (cadastro e edição de perfil). */
export const nameSchema = (t: Translator) =>
  z
    .string()
    .trim()
    .min(2, t("auth.validation.nameRequired"))
    .max(60, t("auth.validation.nameTooLong"));

export const passwordSchema = (t: Translator) =>
  z.string().min(6, t("auth.validation.passwordShort"));

// Nome e confirmação de senha existem nos dois formulários (só aparecem no
// cadastro); no login são ignorados.
export const signInSchema = (t: Translator) =>
  z.object({
    name: z.string(),
    email: emailSchema(t),
    password: z.string().min(1, t("auth.validation.passwordRequired")),
    confirmPassword: z.string(),
  });

export const signUpSchema = (t: Translator) =>
  z
    .object({
      name: nameSchema(t),
      email: emailSchema(t),
      password: passwordSchema(t),
      confirmPassword: z.string().min(1, t("auth.validation.confirmRequired")),
    })
    .superRefine((values, context) => {
      if (
        values.confirmPassword &&
        values.password !== values.confirmPassword
      ) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("auth.validation.mismatch"),
        });
      }
    });

export type AuthFormValues = z.infer<ReturnType<typeof signUpSchema>>;
