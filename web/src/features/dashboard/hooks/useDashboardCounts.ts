import { collection, query, where } from "firebase/firestore";
import { useCount } from "../../../hooks/useCount";
import { db } from "../../../lib/firebase";
import type { MessageStatus } from "../../../types";

/**
 * Totais do cliente para os cards do dashboard. São contagens no servidor:
 * não faz sentido baixar todos os contatos e mensagens só para contar.
 */
export function useDashboardCounts(tenantId: string, refreshKey: string) {
  const contacts = useCount(
    () => query(collection(db, "contacts"), where("tenantId", "==", tenantId)),
    [tenantId],
    refreshKey,
  );

  const countMessages = (status: MessageStatus) =>
    query(
      collection(db, "messages"),
      where("tenantId", "==", tenantId),
      where("status", "==", status),
    );
  const sent = useCount(() => countMessages("sent"), [tenantId], refreshKey);
  const scheduled = useCount(
    () => countMessages("scheduled"),
    [tenantId],
    refreshKey,
  );

  return { contacts, sent, scheduled };
}
