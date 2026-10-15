import { useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { useFirestoreQuery } from "../../../hooks/useFirestoreQuery";
import { db } from "../../../lib/firebase";
import { byName } from "../../../lib/sorting";
import type { Contact } from "../../../types";

/**
 * Contatos do tenant em tempo real, ordenados por nome. Com `connectionId`
 * restringe a uma conexão; sem ele, retorna os de todas as conexões.
 */
export function useContacts(tenantId: string, connectionId?: string) {
  const { items, loading, error } = useFirestoreQuery<Contact>(() => {
    const constraints = [where("tenantId", "==", tenantId)];
    if (connectionId)
      constraints.push(where("connectionId", "==", connectionId));
    return query(collection(db, "contacts"), ...constraints);
  }, [tenantId, connectionId]);

  const contacts = useMemo(() => byName(items), [items]);
  return { contacts, loading, error };
}
