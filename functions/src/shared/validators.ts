import { HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import { LIMITS } from "../config";

// IDs que chegam do cliente viram caminho de documento (collection.doc(id)).
// Restrinjo o formato para não aceitar "/" ou ".." e escapar da coleção.
const documentId = z
  .string({ error: "Identificador inválido." })
  .regex(/^[A-Za-z0-9_-]{1,128}$/, "Identificador inválido.");

const body = z
  .string({ error: "A mensagem é obrigatória." })
  .trim()
  .min(1, "A mensagem não pode ficar vazia.")
  .max(
    LIMITS.messageBodyMaxLength,
    `A mensagem deve ter no máximo ${LIMITS.messageBodyMaxLength} caracteres.`,
  );

const contactIds = z
  .array(documentId, { error: "Selecione pelo menos um contato." })
  .min(1, "Selecione pelo menos um contato.")
  .max(
    LIMITS.maxRecipients,
    `Selecione no máximo ${LIMITS.maxRecipients} contatos.`,
  )
  .refine((ids) => new Set(ids).size === ids.length, "Contatos duplicados.");

// mode + scheduledAt são validados em duas etapas: aqui o formato (ISO 8601
// com fuso) e, em resolveScheduleMs, a regra de negócio (futuro, até 1 ano).
const schedule = {
  mode: z.enum(["now", "scheduled"], { error: "Agendamento inválido." }),
  scheduledAt: z.iso.datetime({ offset: true }).nullish(),
};

export const createMessageInput = z.object({
  connectionId: documentId,
  contactIds,
  body,
  ...schedule,
});

export const updateMessageInput = z.object({
  messageId: documentId,
  contactIds,
  body,
  ...schedule,
});

export const deleteMessageInput = z.object({ messageId: documentId });
export const deleteConnectionInput = z.object({ connectionId: documentId });

/**
 * Valida o payload de uma callable e traduz falhas para `HttpsError`.
 * Devolvo só a primeira mensagem de erro: é a que o usuário vê na tela.
 */
export const parseInput = <T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpsError(
      "invalid-argument",
      result.error.issues[0]?.message ?? "Dados inválidos.",
    );
  }
  return result.data;
};

/**
 * Resolve o instante de envio. Retorna `null` para envio imediato ou os
 * milissegundos (UTC) do agendamento, que deve estar no futuro e dentro do
 * limite configurado. `nowMs` é injetado para manter a função pura.
 */
export const resolveScheduleMs = (
  input: { mode: "now" | "scheduled"; scheduledAt?: string | null },
  nowMs: number,
): number | null => {
  if (input.mode === "now") return null;
  const scheduledMs = input.scheduledAt ? Date.parse(input.scheduledAt) : NaN;
  if (
    !Number.isFinite(scheduledMs) ||
    scheduledMs <= nowMs ||
    scheduledMs > nowMs + LIMITS.maxScheduleAheadMs
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Escolha um horário futuro dentro de um ano.",
    );
  }
  return scheduledMs;
};
