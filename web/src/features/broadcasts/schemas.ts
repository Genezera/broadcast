import { z } from "zod";
import type { Translator } from "../../i18n/translate";
import { isFuture } from "../../lib/dates";

export const MESSAGE_MAX_LENGTH = 2000;
// Mesmos limites do backend (functions/src/config.ts).
export const MAX_RECIPIENTS = 500;
export const MAX_CONNECTIONS = 20;

export type Audience = "contacts" | "connections";

export const messageSchema = (t: Translator) =>
  z
    .object({
      /** `contacts`: contatos escolhidos de uma conexão. `connections`: todos os contatos das conexões escolhidas. */
      audience: z.enum(["contacts", "connections"]),
      connectionId: z.string(),
      contactIds: z.array(z.string()),
      connectionIds: z.array(z.string()),
      body: z
        .string()
        .trim()
        .min(1, t("broadcasts.validation.bodyRequired"))
        .max(
          MESSAGE_MAX_LENGTH,
          t("broadcasts.validation.bodyTooLong", { max: MESSAGE_MAX_LENGTH }),
        ),
      mode: z.enum(["now", "scheduled"]),
      // Valor local ("2026-10-15T18:00"), no fuso do navegador.
      scheduledAt: z.string(),
    })
    .superRefine((values, context) => {
      const issue = (path: string, message: string) =>
        context.addIssue({ code: "custom", path: [path], message });

      // Só o campo do alcance escolhido é exigido.
      if (values.audience === "contacts") {
        if (!values.connectionId) {
          issue("connectionId", t("broadcasts.validation.connectionRequired"));
        }
        if (values.contactIds.length === 0) {
          issue("contactIds", t("broadcasts.validation.recipientsMin"));
        } else if (values.contactIds.length > MAX_RECIPIENTS) {
          issue(
            "contactIds",
            t("broadcasts.validation.recipientsMax", { max: MAX_RECIPIENTS }),
          );
        }
      } else if (values.connectionIds.length === 0) {
        issue("connectionIds", t("broadcasts.validation.connectionsMin"));
      } else if (values.connectionIds.length > MAX_CONNECTIONS) {
        issue(
          "connectionIds",
          t("broadcasts.validation.connectionsMax", { max: MAX_CONNECTIONS }),
        );
      }

      // A data só é obrigatória (e precisa ser futura) quando o envio é agendado.
      if (values.mode !== "scheduled") return;
      if (!values.scheduledAt) {
        issue("scheduledAt", t("broadcasts.validation.dateRequired"));
      } else if (!isFuture(values.scheduledAt)) {
        issue("scheduledAt", t("broadcasts.validation.dateFuture"));
      }
    });

export type MessageFormValues = z.infer<ReturnType<typeof messageSchema>>;
