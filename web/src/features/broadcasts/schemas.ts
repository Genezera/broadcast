import { z } from "zod";
import { isFuture } from "../../lib/dates";

export const MESSAGE_MAX_LENGTH = 2000;
export const MAX_RECIPIENTS = 100;

export const messageSchema = z
  .object({
    contactIds: z
      .array(z.string())
      .min(1, "Selecione pelo menos um contato.")
      .max(MAX_RECIPIENTS, `Selecione no máximo ${MAX_RECIPIENTS} contatos.`),
    body: z
      .string()
      .trim()
      .min(1, "Escreva a mensagem.")
      .max(
        MESSAGE_MAX_LENGTH,
        `Use no máximo ${MESSAGE_MAX_LENGTH} caracteres.`,
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
        message: "Informe a data e o horário do envio.",
      });
    } else if (!isFuture(values.scheduledAt)) {
      context.addIssue({
        code: "custom",
        path: ["scheduledAt"],
        message: "Escolha uma data e um horário futuros.",
      });
    }
  });

export type MessageFormValues = z.infer<typeof messageSchema>;
