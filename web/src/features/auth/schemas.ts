import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe o e-mail.")
  .email("Digite um e-mail válido.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha."),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export type AuthFormValues = z.infer<typeof signUpSchema>;
