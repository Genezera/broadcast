import { collection, query } from "firebase/firestore";
import { useCount } from "../../../hooks/useCount";
import { db } from "../../../lib/firebase";
import type { MessageStatus } from "../../../types";
import { connectionMessagesConstraints } from "./useMessages";

function useMessageCount(
  tenantId: string,
  connectionId: string,
  status: MessageStatus | undefined,
  refreshKey: string,
) {
  return useCount(
    () =>
      query(
        collection(db, "messages"),
        ...connectionMessagesConstraints(tenantId, connectionId, status),
      ),
    [tenantId, connectionId, status],
    refreshKey,
  );
}

/** Totais por status de uma conexão, exibidos nos filtros da tela de broadcast. */
export function useMessageCounts(
  tenantId: string,
  connectionId: string,
  refreshKey: string,
) {
  return {
    all: useMessageCount(tenantId, connectionId, undefined, refreshKey),
    sent: useMessageCount(tenantId, connectionId, "sent", refreshKey),
    scheduled: useMessageCount(tenantId, connectionId, "scheduled", refreshKey),
  };
}
