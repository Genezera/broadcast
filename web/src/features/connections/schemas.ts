import { z } from "zod";
import type { Translator } from "../../i18n/translate";

export const connectionSchema = (t: Translator) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("connections.validation.nameRequired"))
      .max(100, t("connections.validation.nameTooLong")),
  });

export type ConnectionFormValues = z.infer<ReturnType<typeof connectionSchema>>;
