import { z } from "zod";
import type { Translator } from "../../i18n/translate";
import { isValidPhone } from "../../lib/phone";

// Mesmo padrão do validPhone em firestore.rules. Se mudar um, mudar o outro.
const PHONE_PATTERN = /^\+?[0-9 ()-]{8,24}$/;

export const contactSchema = (t: Translator) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("contacts.validation.nameRequired"))
      .max(100, t("contacts.validation.nameTooLong")),
    phone: z
      .string()
      .trim()
      .regex(PHONE_PATTERN, t("contacts.validation.phoneFormat"))
      // Além do formato (igual ao das rules), confere se o número existe no país.
      .refine(isValidPhone, t("contacts.validation.phoneInvalid")),
  });

export type ContactFormValues = z.infer<ReturnType<typeof contactSchema>>;
