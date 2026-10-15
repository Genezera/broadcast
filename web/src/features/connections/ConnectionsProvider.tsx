import { createContext, useContext, type ReactNode } from "react";
import type { Connection } from "../../types";
import { useConnections } from "./hooks/useConnections";

type ConnectionsState = {
  connections: Connection[];
  activeConnections: Connection[];
  loading: boolean;
  error: string;
};

const ConnectionsContext = createContext<ConnectionsState | null>(null);

/** Mantém uma única assinatura das conexões compartilhada por todas as telas. */
export function ConnectionsProvider({
  tenantId,
  children,
}: {
  tenantId: string;
  children: ReactNode;
}) {
  const state = useConnections(tenantId);
  return (
    <ConnectionsContext.Provider value={state}>
      {children}
    </ConnectionsContext.Provider>
  );
}

export function useConnectionsContext(): ConnectionsState {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error(
      "useConnectionsContext deve ser usado dentro de ConnectionsProvider.",
    );
  }
  return context;
}
