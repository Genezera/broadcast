import { Button, Chip, IconButton, Tooltip } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import { formatDateTime } from "../../../lib/dates";
import type { Connection } from "../../../types";

type ConnectionCardProps = {
  connection: Connection;
  /** Posição na grade; define o atraso da animação de entrada. */
  index: number;
  onEdit: (connection: Connection) => void;
  onDelete: (connection: Connection) => void;
  onOpen: (connection: Connection) => void;
};

export function ConnectionCard({
  connection,
  index,
  onEdit,
  onDelete,
  onOpen,
}: ConnectionCardProps) {
  const deleting = connection.status === "deleting";
  return (
    <article
      className="animate-item hover-lift rounded-xl border border-line bg-white p-5 hover:border-[#cdc7ff]"
      style={{ ["--i" as string]: index }}
    >
      <div className="flex items-start justify-between">
        <span className="metric-icon bg-brand-soft text-brand">
          <HubOutlinedIcon />
        </span>
        <div>
          <Tooltip title="Editar">
            <span>
              <IconButton
                size="small"
                aria-label={`Editar ${connection.name}`}
                onClick={() => onEdit(connection)}
                disabled={deleting}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={deleting ? "Tentar exclusão novamente" : "Excluir"}>
            <IconButton
              size="small"
              color="error"
              aria-label={`Excluir ${connection.name}`}
              onClick={() => onDelete(connection)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <h2 className="mt-5 break-words font-display text-lg font-extrabold">
        {connection.name}
      </h2>
      <p className="mt-1 text-xs text-muted">
        Criada em {formatDateTime(connection.createdAt)}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <Chip
          size="small"
          label={deleting ? "Excluindo" : "Ativa"}
          className={
            deleting
              ? "bg-warning-soft text-warning"
              : "bg-success-soft text-success"
          }
        />
        <Button
          size="small"
          endIcon={<ArrowForwardIcon />}
          disabled={deleting}
          onClick={() => onOpen(connection)}
        >
          Ver contatos
        </Button>
      </div>
    </article>
  );
}
