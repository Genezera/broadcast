import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe o e-mail.")
  .email("Digite um e-mail válido.");

/** Nome de exibição do cliente (cadastro e edição de perfil). */
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Informe seu nome.")
  .max(60, "Use no máximo 60 caracteres.");

export const passwordSchema = z
  .string()
  .min(6, "A senha deve ter pelo menos 6 caracteres.");

// O campo de nome existe nos dois formulários (só aparece no cadastro); no
// login ele é ignorado.
export const signInSchema = z.object({
  name: z.string(),
  email: emailSchema,
  password: z.string().min(1, "Informe a senha."),
});

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type AuthFormValues = z.infer<typeof signUpSchema>;
