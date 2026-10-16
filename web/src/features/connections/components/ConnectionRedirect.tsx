import { Link, Navigate } from "react-router-dom";
import { Button } from "@mui/material";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Loading } from "../../../components/ui/Loading";
import { useConnectionsContext } from "../ConnectionsProvider";
import { useI18n } from "../../../i18n/I18nProvider";
import { readLastConnectionId } from "../lastConnection";

/**
 * Destino do atalho `/contacts` do menu: leva à última conexão utilizada (ou
 * à primeira ativa) ou orienta a criar uma conexão. (Broadcast mostra as
 * mensagens de todas as conexões, então não precisa de uma conexão atual.)
 */
export function ConnectionRedirect() {
  const { t } = useI18n();
  const { activeConnections, loading } = useConnectionsContext();
  if (loading) return <Loading />;

  const lastId = readLastConnectionId();
  const target =
    activeConnections.find((connection) => connection.id === lastId) ??
    activeConnections[0];
  if (target) {
    return <Navigate to={`/connections/${target.id}/contacts`} replace />;
  }

  return (
    <div className="surface">
      <EmptyState
        icon={<HubOutlinedIcon sx={{ fontSize: 38 }} />}
        title={t("connections.createFirstTitle")}
        description={t("connections.createFirstContacts")}
        action={
          <Button component={Link} to="/connections" variant="contained">
            {t("connections.goToConnections")}
          </Button>
        }
      />
    </div>
  );
}
