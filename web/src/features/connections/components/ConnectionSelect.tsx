import { useNavigate } from "react-router-dom";
import { MenuItem, TextField } from "@mui/material";
import { useI18n } from "../../../i18n/I18nProvider";
import { useConnectionsContext } from "../ConnectionsProvider";
import { useScopedConnection } from "./ConnectionScope";

/** Troca a conexão atual da tela de contatos. */
export function ConnectionSelect() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const current = useScopedConnection();
  const { activeConnections } = useConnectionsContext();

  return (
    <TextField
      select
      value={current.id}
      onChange={(event) =>
        navigate(`/connections/${event.target.value}/contacts`)
      }
      className="min-w-0 flex-1 sm:flex-none"
      sx={{ minWidth: { sm: 190 } }}
      slotProps={{ htmlInput: { "aria-label": t("connections.selectAria") } }}
    >
      {activeConnections.map((connection) => (
        <MenuItem key={connection.id} value={connection.id}>
          {connection.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
