import {
  collection,
  limit,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { useFirestoreQuery } from "../../../hooks/useFirestoreQuery";
import { db } from "../../../lib/firebase";
import type { Message, MessageStatus } from "../../../types";

type Options = {
  /** Filtra no Firestore; sem isso traz enviadas e agendadas. */
  status?: MessageStatus;
  /** Quantidade máxima de mensagens carregadas (paginação por limite). */
  max: number;
};

/** Constraints comuns a todas as consultas de mensagens de uma conexão. */
export const connectionMessagesConstraints = (
  tenantId: string,
  connectionId: string,
  status?: MessageStatus,
): QueryConstraint[] => {
  const constraints = [
    where("tenantId", "==", tenantId),
    where("connectionId", "==", connectionId),
  ];
  if (status) constraints.push(where("status", "==", status));
  return constraints;
};

/**
 * Mensagens de uma conexão, da mais recente para a mais antiga.
 *
 * Em vez de paginar com cursores, aumento o `limit` e a assinatura é refeita.
 * Assim a lista continua em tempo real (onSnapshot) mesmo com "carregar mais".
 * Os índices compostos usados aqui estão em firestore.indexes.json.
 */
export function useMessages(
  tenantId: string,
  connectionId: string,
  { status, max }: Options,
) {
  const { items, loading, error } = useFirestoreQuery<Message>(
    () =>
      query(
        collection(db, "messages"),
        ...connectionMessagesConstraints(tenantId, connectionId, status),
        orderBy("createdAt", "desc"),
        limit(max),
      ),
    [tenantId, connectionId, status, max],
  );
  return { messages: items, loading, error };
}

/** Últimas mensagens do cliente, de todas as conexões (usado no dashboard). */
export function useRecentMessages(tenantId: string, max: number) {
  const { items, loading, error } = useFirestoreQuery<Message>(
    () =>
      query(
        collection(db, "messages"),
        where("tenantId", "==", tenantId),
        orderBy("createdAt", "desc"),
        limit(max),
      ),
    [tenantId, max],
  );
  return { messages: items, loading, error };
}
