import type {
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { collections } from "../firebase";
import { belongsToTenant } from "../shared/authorization";
import type { Recipient } from "../shared/types";

/** Exige que a conexão exista, seja do tenant e não esteja em exclusão. */
export const assertActiveConnection = async (
  transaction: Transaction,
  tenantId: string,
  connectionId: string,
): Promise<void> => {
  const connection = await transaction.get(
    collections.connections.doc(connectionId),
  );
  if (
    !belongsToTenant(connection, tenantId) ||
    connection.get("status") !== "active"
  ) {
    throw new HttpsError("not-found", "Conexão não encontrada.");
  }
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
    throw new HttpsError(
      "invalid-argument",
      "Um dos contatos não pertence a esta conexão.",
    );
  });
};
