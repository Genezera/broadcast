import { z } from "zod";
import { nameSchema, passwordSchema } from "../auth/schemas";

export const profileSchema = z.object({ name: nameSchema });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .superRefine((values, context) => {
    if (
      values.confirmPassword &&
      values.newPassword !== values.confirmPassword
    ) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "As senhas não conferem.",
      });
    }
    if (values.newPassword && values.newPassword === values.currentPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "A nova senha deve ser diferente da atual.",
      });
    }
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
