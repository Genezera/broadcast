import { Button, Chip, IconButton, Tooltip } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import { useI18n } from "../../../i18n/I18nProvider";
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
  const { t, formatDateTime } = useI18n();
  const deleting = connection.status === "deleting";
  return (
    <article
      className="animate-item hover-lift rounded-xl border border-line bg-surface p-5 hover:border-brand/40"
      style={{ ["--i" as string]: index }}
    >
      <div className="flex items-start justify-between">
        <span className="metric-icon bg-brand-soft text-brand">
          <HubOutlinedIcon />
        </span>
        <div>
          <Tooltip title={t("common.edit")}>
            <span>
              <IconButton
                size="small"
                aria-label={t("connections.editAria", {
                  name: connection.name,
                })}
                onClick={() => onEdit(connection)}
                disabled={deleting}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip
            title={deleting ? t("connections.retryDelete") : t("common.delete")}
          >
            <IconButton
              size="small"
              color="error"
              aria-label={t("connections.deleteAria", {
                name: connection.name,
              })}
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
        {t("connections.createdAt", {
          date: formatDateTime(connection.createdAt),
        })}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <Chip
          size="small"
          label={deleting ? t("status.deleting") : t("status.active")}
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
          {t("connections.viewContacts")}
        </Button>
      </div>
    </article>
  );
}
