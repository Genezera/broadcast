import { FieldValue } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { callableOptions, LIMITS } from "../config";
import { collections, db } from "../firebase";
import {
  assertBelongsToTenant,
  requireTenantId,
} from "../shared/authorization";
import { deleteConnectionInput, parseInput } from "../shared/validators";

const deleteInBatches = async (
  collection: "contacts" | "messages",
  tenantId: string,
  connectionId: string,
): Promise<number> => {
  let deleted = 0;
  // O batch do Firestore aceita no máximo 500 operações, por isso apago em
  // lotes de 400 até a consulta voltar vazia.
  for (;;) {
    const snapshot = await collections[collection]
      .where("tenantId", "==", tenantId)
      .where("connectionId", "==", connectionId)
      .limit(LIMITS.batchSize)
      .get();
    if (snapshot.empty) return deleted;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
  }
};

/**
 * Exclusão em cascata controlada. A conexão passa para `deleting` (as
 * Security Rules e as demais funções bloqueiam novas escritas), seus contatos
 * e mensagens são removidos e, por fim, a própria conexão. Se a execução for
 * interrompida, repetir a chamada conclui a limpeza.
 */
export const deleteConnection = onCall(
  { ...callableOptions, timeoutSeconds: 540 },
  async (request) => {
    const tenantId = requireTenantId(request.auth?.uid);
    const { connectionId } = parseInput(deleteConnectionInput, request.data);
    const ref = collections.connections.doc(connectionId);

    // Passo 1: marcar como "deleting". A partir daqui as rules e as outras
    // functions recusam novos contatos e mensagens nesta conexão, então a
    // limpeza abaixo não corre contra novas gravações.
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      assertBelongsToTenant(snapshot, tenantId, "Conexão não encontrada.");
      transaction.update(ref, {
        status: "deleting",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // Passo 2: apagar os filhos e, por último, a conexão. Se cair no meio,
    // a conexão continua "deleting" e dá para repetir a exclusão.
    const contacts = await deleteInBatches("contacts", tenantId, connectionId);
    const messages = await deleteInBatches("messages", tenantId, connectionId);
    await ref.delete();

    logger.info("connection_deleted", {
      tenantId,
      connectionId,
      contacts,
      messages,
    });
    return { ok: true };
  },
);
