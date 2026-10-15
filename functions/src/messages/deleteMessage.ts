import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { callableOptions } from "../config";
import { collections, db } from "../firebase";
import {
  assertBelongsToTenant,
  requireTenantId,
} from "../shared/authorization";
import { deleteMessageInput, parseInput } from "../shared/validators";

export const deleteMessage = onCall(callableOptions, async (request) => {
  const tenantId = requireTenantId(request.auth?.uid);
  const { messageId } = parseInput(deleteMessageInput, request.data);
  const ref = collections.messages.doc(messageId);

  // Na transação, a exclusão não corre contra o agendador: se ele já tiver
  // enviado a mensagem, o delete vale sobre o estado final; se ainda não,
  // o documento some e a varredura simplesmente não o encontra mais.
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    assertBelongsToTenant(snapshot, tenantId, "messageNotFound");
    transaction.delete(ref);
  });

  logger.info("message_deleted", { tenantId, messageId });
  return { ok: true };
});
