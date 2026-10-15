import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { callableOptions } from "../config";
import { collections, db } from "../firebase";
import { requireTenantId } from "../shared/authorization";
import {
  createMessageInput,
  parseInput,
  resolveScheduleMs,
} from "../shared/validators";
import { assertActiveConnection, resolveRecipients } from "./recipients";

/** Cria uma mensagem enviada de imediato (simulação) ou agendada. */
export const createMessage = onCall(callableOptions, async (request) => {
  // O tenant vem sempre do token de autenticação. Nunca confio em um
  // tenantId enviado no corpo da requisição.
  const tenantId = requireTenantId(request.auth?.uid);
  const input = parseInput(createMessageInput, request.data);
  const scheduledMs = resolveScheduleMs(input, Date.now());
  const status = scheduledMs === null ? "sent" : "scheduled";
  // Gero o ID antes da transação para poder devolvê-lo ao cliente.
  const ref = collections.messages.doc();

  // Valido e gravo na mesma transação: se a conexão for excluída ou um contato
  // mudar no meio do caminho, a gravação falha em vez de salvar dado inconsistente.
  await db.runTransaction(async (transaction) => {
    await assertActiveConnection(transaction, tenantId, input.connectionId);
    // Os contatos precisam ser do mesmo tenant E da mesma conexão.
    const recipients = await resolveRecipients(
      transaction,
      tenantId,
      input.connectionId,
      input.contactIds,
    );
    const now = FieldValue.serverTimestamp();
    transaction.create(ref, {
      tenantId,
      connectionId: input.connectionId,
      body: input.body,
      contactIds: input.contactIds,
      recipients,
      status,
      // Envio imediato já nasce como "sent". Agendado fica "scheduled" e o
      // processScheduledMessages muda o status quando chegar a hora.
      scheduledAt:
        scheduledMs === null ? null : Timestamp.fromMillis(scheduledMs),
      sentAt: scheduledMs === null ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  });

  logger.info("message_created", {
    tenantId,
    messageId: ref.id,
    status,
    recipients: input.contactIds.length,
  });
  return { id: ref.id };
});
