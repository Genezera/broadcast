import { useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { useFirestoreQuery } from "../../../hooks/useFirestoreQuery";
import { db } from "../../../lib/firebase";
import { byName } from "../../../lib/sorting";
import type { Connection } from "../../../types";

/** Conexões do tenant em tempo real, ordenadas por nome. */
export function useConnections(tenantId: string) {
  const { items, loading, error } = useFirestoreQuery<Connection>(
    () =>
      query(collection(db, "connections"), where("tenantId", "==", tenantId)),
    [tenantId],
  );
  const connections = useMemo(() => byName(items), [items]);
  const activeConnections = useMemo(
    () => connections.filter((item) => item.status === "active"),
    [connections],
  );
  return { connections, activeConnections, loading, error };
}
