import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { callableOptions } from "../config";
import { collections, db } from "../firebase";
import {
  assertBelongsToTenant,
  requireTenantId,
} from "../shared/authorization";
import { fail } from "../shared/errors";
import type { Recipient } from "../shared/types";
import {
  parseInput,
  resolveScheduleMs,
  updateMessageInput,
} from "../shared/validators";
import { assertActiveConnection, resolveRecipients } from "./recipients";

/**
 * Edita conteúdo, destinatários e horário de uma mensagem. A conexão da
 * mensagem é imutável. Uma mensagem já enviada pode ter o registro editado,
 * mas nunca volta a ser agendada nem é disparada novamente.
 */
export const updateMessage = onCall(callableOptions, async (request) => {
  const tenantId = requireTenantId(request.auth?.uid);
  const input = parseInput(updateMessageInput, request.data);
  const scheduledMs = resolveScheduleMs(input, Date.now());
  const ref = collections.messages.doc(input.messageId);

  await db.runTransaction(async (transaction) => {
    // Releio a mensagem dentro da transação: se o agendador a marcar como
    // enviada enquanto o usuário edita, quem vale é o estado atual.
    const current = await transaction.get(ref);
    assertBelongsToTenant(current, tenantId, "messageNotFound");
    // A conexão sai do documento salvo, não do request. Assim não dá para
    // "mover" uma mensagem para outra conexão editando.
    const connectionId = current.get("connectionId") as string;

    await assertActiveConnection(transaction, tenantId, connectionId);
    const recipients = await resolveRecipients(
      transaction,
      tenantId,
      connectionId,
      input.contactIds,
      (current.get("recipients") ?? []) as Recipient[],
    );

    const alreadySent = current.get("status") === "sent";
    // Se o agendador enviou a mensagem entre abrir e salvar a edição, não
    // deixo ela voltar para "agendada" (seria um segundo envio).
    if (alreadySent && scheduledMs !== null) {
      throw fail("failed-precondition", "sentCannotReschedule");
    }

    const now = FieldValue.serverTimestamp();
    const content = {
      body: input.body,
      contactIds: input.contactIds,
      recipients,
      updatedAt: now,
    };
    // Mensagem já enviada: só corrijo o registro, sem tocar em status nem datas.
    if (alreadySent) {
      transaction.update(ref, content);
      return;
    }
    transaction.update(ref, {
      ...content,
      status: scheduledMs === null ? "sent" : "scheduled",
      scheduledAt:
        scheduledMs === null ? null : Timestamp.fromMillis(scheduledMs),
      sentAt: scheduledMs === null ? now : null,
    });
  });

  logger.info("message_updated", { tenantId, messageId: ref.id });
  return { id: ref.id };
});
