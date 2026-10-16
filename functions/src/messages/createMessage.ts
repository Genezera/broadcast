import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { callableOptions } from "../config";
import { collections, db } from "../firebase";
import { requireTenantId } from "../shared/authorization";
import { fail } from "../shared/errors";
import { writeSentNotification } from "../shared/notifications";
import type { Recipient } from "../shared/types";
import {
  createBroadcastInput,
  createMessageInput,
  parseInput,
  resolveScheduleMs,
} from "../shared/validators";
import {
  allContactsOf,
  assertActiveConnection,
  resolveRecipients,
} from "./recipients";

/** Uma mensagem a ser criada: sempre pertence a uma única conexão. */
type Plan = {
  connectionId: string;
  connectionName: string;
  recipients: Recipient[];
};

/**
 * Cria mensagens enviadas de imediato (simulação) ou agendadas.
 *
 * Dois alcances, escolhidos por `audience`:
 * - `contacts` (padrão): contatos escolhidos de uma conexão;
 * - `connections`: todos os contatos de uma ou mais conexões. Como cada
 *   mensagem pertence a uma conexão, sai uma mensagem por conexão.
 */
export const createMessage = onCall(callableOptions, async (request) => {
  // O tenant vem sempre do token de autenticação. Nunca confio em um
  // tenantId enviado no corpo da requisição.
  const tenantId = requireTenantId(request.auth?.uid);
  const wholeConnections = request.data?.audience === "connections";
  const input = wholeConnections
    ? parseInput(createBroadcastInput, request.data)
    : parseInput(createMessageInput, request.data);
  const scheduledMs = resolveScheduleMs(input, Date.now());
  const status = scheduledMs === null ? "sent" : "scheduled";

  // Valido e gravo na mesma transação: se uma conexão for excluída ou um
  // contato mudar no meio do caminho, nada é salvo pela metade.
  const created = await db.runTransaction(async (transaction) => {
    // O Firestore exige todas as leituras antes das escritas: primeiro monto
    // o plano (uma entrada por conexão) e só depois gravo.
    const plans: Plan[] = [];
    if ("connectionIds" in input) {
      for (const connectionId of input.connectionIds) {
        const connectionName = await assertActiveConnection(
          transaction,
          tenantId,
          connectionId,
        );
        const recipients = await allContactsOf(
          transaction,
          tenantId,
          connectionId,
        );
        // Conexão sem contatos é simplesmente pulada.
        if (recipients.length > 0) {
          plans.push({ connectionId, connectionName, recipients });
        }
      }
      if (plans.length === 0) {
        throw fail("invalid-argument", "noContactsInConnections");
      }
    } else {
      const connectionName = await assertActiveConnection(
        transaction,
        tenantId,
        input.connectionId,
      );
      // Os contatos precisam ser do mesmo tenant E da mesma conexão.
      const recipients = await resolveRecipients(
        transaction,
        tenantId,
        input.connectionId,
        input.contactIds,
      );
      plans.push({
        connectionId: input.connectionId,
        connectionName,
        recipients,
      });
    }

    const now = FieldValue.serverTimestamp();
    return plans.map((plan) => {
      const ref = collections.messages.doc();
      transaction.create(ref, {
        tenantId,
        connectionId: plan.connectionId,
        body: input.body,
        contactIds: plan.recipients.map((recipient) => recipient.id),
        recipients: plan.recipients,
        status,
        // Envio imediato já nasce como "sent". Agendado fica "scheduled" e o
        // processScheduledMessages muda o status quando chegar a hora.
        scheduledAt:
          scheduledMs === null ? null : Timestamp.fromMillis(scheduledMs),
        sentAt: scheduledMs === null ? now : null,
        createdAt: now,
        updatedAt: now,
      });
      // Envio imediato: o aviso nasce junto com a mensagem. Agendadas são
      // avisadas pelo agendador, quando de fato forem enviadas.
      if (scheduledMs === null) {
        writeSentNotification(transaction, {
          tenantId,
          messageId: ref.id,
          connectionId: plan.connectionId,
          connectionName: plan.connectionName,
          recipientCount: plan.recipients.length,
          body: input.body,
          scheduled: false,
        });
      }
      return { id: ref.id, recipients: plan.recipients.length };
    });
  });

  logger.info("message_created", {
    tenantId,
    messages: created.length,
    status,
    recipients: created.reduce((sum, item) => sum + item.recipients, 0),
  });
  return {
    id: created[0].id,
    ids: created.map((item) => item.id),
    connectionCount: created.length,
    recipientCount: created.reduce((sum, item) => sum + item.recipients, 0),
  };
});
