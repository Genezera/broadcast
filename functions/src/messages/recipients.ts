import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { LIMITS } from "../config";
import { collections } from "../firebase";
import { belongsToTenant } from "../shared/authorization";
import { fail } from "../shared/errors";
import type { Recipient } from "../shared/types";

/**
 * Exige que a conexão exista, seja do tenant e não esteja em exclusão.
 * Devolve o nome dela (usado nas notificações).
 */
export const assertActiveConnection = async (
  transaction: Transaction,
  tenantId: string,
  connectionId: string,
): Promise<string> => {
  const connection = await transaction.get(
    collections.connections.doc(connectionId),
  );
  if (
    !belongsToTenant(connection, tenantId) ||
    connection.get("status") !== "active"
  ) {
    throw fail("not-found", "connectionNotFound");
  }
  return connection.get("name") as string;
};

/**
 * Todos os contatos de uma conexão, em ordem alfabética. Passar do limite é
 * um erro: a mensagem guarda um snapshot de cada destinatário no documento.
 */
export const allContactsOf = async (
  transaction: Transaction,
  tenantId: string,
  connectionId: string,
): Promise<Recipient[]> => {
  const snapshot = await transaction.get(
    collections.contacts
      .where("tenantId", "==", tenantId)
      .where("connectionId", "==", connectionId)
      .limit(LIMITS.maxRecipients + 1),
  );
  if (snapshot.size > LIMITS.maxRecipients) {
    throw fail("invalid-argument", "tooManyRecipients", {
      max: LIMITS.maxRecipients,
    });
  }
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      name: doc.get("name") as string,
      phone: doc.get("phone") as string,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Carrega os contatos selecionados e monta os snapshots dos destinatários.
 * Cada contato precisa pertencer ao mesmo tenant e à mesma conexão da
 * mensagem. Contatos já removidos só são aceitos se constarem do histórico
 * da própria mensagem (`previous`), o que permite editá-la sem perdê-los.
 */
export const resolveRecipients = async (
  transaction: Transaction,
  tenantId: string,
  connectionId: string,
  contactIds: string[],
  previous: Recipient[] = [],
): Promise<Recipient[]> => {
  const refs: DocumentReference[] = contactIds.map((contactId) =>
    collections.contacts.doc(contactId),
  );
  // getAll lê todos os contatos de uma vez (uma ida ao banco, não N).
  const snapshots: DocumentSnapshot[] = await transaction.getAll(...refs);

  return snapshots.map((snapshot) => {
    if (
      belongsToTenant(snapshot, tenantId) &&
      snapshot.get("connectionId") === connectionId
    ) {
      return {
        id: snapshot.id,
        name: snapshot.get("name") as string,
        phone: snapshot.get("phone") as string,
      };
    }
    // Contato que foi apagado depois do envio: aceito apenas se já estava
    // nesta mesma mensagem, para o histórico continuar completo na edição.
    const archived = previous.find((recipient) => recipient.id === snapshot.id);
    if (archived && !snapshot.exists) return archived;
    throw fail("invalid-argument", "recipientNotInConnection");
  });
};
