import { z } from "zod";
import type { Translator } from "../../i18n/translate";
import { isFuture } from "../../lib/dates";

export const MESSAGE_MAX_LENGTH = 2000;
const MAX_RECIPIENTS = 100;

export const messageSchema = (t: Translator) =>
  z
    .object({
      contactIds: z
        .array(z.string())
        .min(1, t("broadcasts.validation.recipientsMin"))
        .max(
          MAX_RECIPIENTS,
          t("broadcasts.validation.recipientsMax", { max: MAX_RECIPIENTS }),
        ),
      body: z
        .string()
        .trim()
        .min(1, t("broadcasts.validation.bodyRequired"))
        .max(
          MESSAGE_MAX_LENGTH,
          t("broadcasts.validation.bodyTooLong", { max: MESSAGE_MAX_LENGTH }),
        ),
      mode: z.enum(["now", "scheduled"]),
      // Valor cru do <input type="datetime-local">, no fuso do navegador.
      scheduledAt: z.string(),
    })
    // A data só é obrigatória (e precisa ser futura) quando o envio é agendado.
    .superRefine((values, context) => {
      if (values.mode !== "scheduled") return;
      if (!values.scheduledAt) {
        context.addIssue({
          code: "custom",
          path: ["scheduledAt"],
          message: t("broadcasts.validation.dateRequired"),
        });
      } else if (!isFuture(values.scheduledAt)) {
        context.addIssue({
          code: "custom",
          path: ["scheduledAt"],
          message: t("broadcasts.validation.dateFuture"),
        });
      }
    });

export type MessageFormValues = z.infer<ReturnType<typeof messageSchema>>;
