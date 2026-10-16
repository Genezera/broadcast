import { z } from "zod";
import { LIMITS } from "../config";
import { fail, isErrorKey } from "./errors";

// As mensagens dos schemas são chaves de erro (ver shared/errors.ts), que o
// cliente traduz. Por isso aqui aparecem nomes como "bodyEmpty", não frases.

// IDs que chegam do cliente viram caminho de documento (collection.doc(id)).
// Restrinjo o formato para não aceitar "/" ou ".." e escapar da coleção.
const documentId = z
  .string({ error: "invalidId" })
  .regex(/^[A-Za-z0-9_-]{1,128}$/, "invalidId");

const body = z
  .string({ error: "bodyRequired" })
  .trim()
  .min(1, "bodyEmpty")
  .max(LIMITS.messageBodyMaxLength, "bodyTooLong");

const contactIds = z
  .array(documentId, { error: "noRecipients" })
  .min(1, "noRecipients")
  .max(LIMITS.maxRecipients, "tooManyRecipients")
  .refine((ids) => new Set(ids).size === ids.length, "duplicateRecipients");

// mode + scheduledAt são validados em duas etapas: aqui o formato (ISO 8601
// com fuso) e, em resolveScheduleMs, a regra de negócio (futuro, até 1 ano).
const schedule = {
  mode: z.enum(["now", "scheduled"], { error: "invalidSchedule" }),
  scheduledAt: z.iso.datetime({ offset: true }).nullish(),
};

// Envio para contatos escolhidos de uma conexão.
export const createMessageInput = z.object({
  connectionId: documentId,
  contactIds,
  body,
  ...schedule,
});

// Envio para todos os contatos de uma ou mais conexões (uma mensagem por
// conexão). Repetidas são ignoradas.
const connectionIds = z
  .array(documentId, { error: "noConnections" })
  .min(1, "noConnections")
  .max(LIMITS.maxConnectionsPerSend, "tooManyConnections")
  .transform((ids) => [...new Set(ids)]);

export const createBroadcastInput = z.object({
  connectionIds,
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

// Valores usados nas frases com {max}.
const PARAMS = {
  bodyTooLong: { max: LIMITS.messageBodyMaxLength },
  tooManyRecipients: { max: LIMITS.maxRecipients },
  tooManyConnections: { max: LIMITS.maxConnectionsPerSend },
} as const;

/**
 * Valida o payload de uma callable e traduz falhas para `HttpsError`.
 * Devolvo só o primeiro erro: é o que o usuário vê na tela.
 */
export const parseInput = <T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "";
    const key = isErrorKey(message) ? message : "invalidData";
    throw fail(
      "invalid-argument",
      key,
      key in PARAMS ? PARAMS[key as keyof typeof PARAMS] : undefined,
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
    throw fail("invalid-argument", "scheduleOutOfRange");
  }
  return scheduledMs;
};
