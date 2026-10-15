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

// O campo de nome existe nos dois formulários (só aparece no cadastro); no
// login ele é ignorado.
export const signInSchema = (t: Translator) =>
  z.object({
    name: z.string(),
    email: emailSchema(t),
    password: z.string().min(1, t("auth.validation.passwordRequired")),
  });

export const signUpSchema = (t: Translator) =>
  z.object({
    name: nameSchema(t),
    email: emailSchema(t),
    password: passwordSchema(t),
  });

export type AuthFormValues = z.infer<ReturnType<typeof signUpSchema>>;
