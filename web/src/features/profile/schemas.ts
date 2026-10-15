import { z } from "zod";
import type { Translator } from "../../i18n/translate";
import { nameSchema, passwordSchema } from "../auth/schemas";

export const profileSchema = (t: Translator) =>
  z.object({ name: nameSchema(t) });

export const changePasswordSchema = (t: Translator) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, t("profile.validation.currentRequired")),
      newPassword: passwordSchema(t),
      confirmPassword: z
        .string()
        .min(1, t("profile.validation.confirmRequired")),
    })
    .superRefine((values, context) => {
      if (
        values.confirmPassword &&
        values.newPassword !== values.confirmPassword
      ) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("profile.validation.mismatch"),
        });
      }
      if (values.newPassword && values.newPassword === values.currentPassword) {
        context.addIssue({
          code: "custom",
          path: ["newPassword"],
          message: t("profile.validation.sameAsCurrent"),
        });
      }
    });

export type ProfileFormValues = z.infer<ReturnType<typeof profileSchema>>;
export type ChangePasswordValues = z.infer<
  ReturnType<typeof changePasswordSchema>
>;
