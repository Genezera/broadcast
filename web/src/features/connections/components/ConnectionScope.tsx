import { createContext, useContext, useEffect } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { Button } from "@mui/material";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Loading } from "../../../components/ui/Loading";
import { useI18n } from "../../../i18n/I18nProvider";
import type { Connection } from "../../../types";
import { useConnectionsContext } from "../ConnectionsProvider";
import { saveLastConnectionId } from "../lastConnection";

const ScopedConnectionContext = createContext<Connection | null>(null);

/**
 * Resolve a conexão da URL (`/connections/:connectionId/...`) entre as
 * conexões ativas do tenant. Rotas filhas só renderizam com uma conexão válida.
 */
export function ConnectionScope() {
  const { t } = useI18n();
  const { connectionId } = useParams();
  const { activeConnections, loading } = useConnectionsContext();
  const connection = activeConnections.find((item) => item.id === connectionId);

  // Guarda a última conexão aberta para os atalhos "Contatos" e "Broadcast" do menu.
  useEffect(() => {
    if (connection) saveLastConnectionId(connection.id);
  }, [connection]);

  if (loading) return <Loading />;
  // Cobre o ID inexistente, a conexão em exclusão e a de outro cliente. Como a
  // lista já vem filtrada por tenant, nem chega a existir dado alheio aqui.
  if (!connection) {
    return (
      <div className="surface">
        <EmptyState
          icon={<HubOutlinedIcon sx={{ fontSize: 38 }} />}
          title={t("connections.notFoundTitle")}
          description={t("connections.notFoundText")}
          action={
            <Button component={Link} to="/connections" variant="contained">
              {t("connections.seeConnections")}
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <ScopedConnectionContext.Provider value={connection}>
      <Outlet />
    </ScopedConnectionContext.Provider>
  );
}

export function useScopedConnection(): Connection {
  const connection = useContext(ScopedConnectionContext);
  if (!connection) {
    throw new Error(
      "useScopedConnection deve ser usado dentro de ConnectionScope.",
    );
  }
  return connection;
}
