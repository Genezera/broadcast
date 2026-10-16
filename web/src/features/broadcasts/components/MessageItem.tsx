import { Chip, IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { FormattedText } from "../../../components/ui/FormattedText";
import { StatusChip } from "../../../components/ui/StatusChip";
import { useI18n } from "../../../i18n/I18nProvider";
import type { Message } from "../../../types";

type MessageItemProps = {
  message: Message;
  /** Nome da conexão; só aparece quando a lista mistura várias conexões. */
  connectionName?: string;
  /** Posição na lista; define o atraso da animação de entrada. */
  index: number;
  onView: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
};

/** Quantos nomes aparecem no resumo; o resto fica no "+N" e nos detalhes. */
const PREVIEW_NAMES = 3;

export function MessageItem({
  message,
  connectionName,
  index,
  onView,
  onEdit,
  onDelete,
}: MessageItemProps) {
  const { t, formatDateTime } = useI18n();
  const sent = message.status === "sent";
  const failed = message.status === "failed";
  const names = message.recipients.map((recipient) => recipient.name);
  const summary =
    names.slice(0, PREVIEW_NAMES).join(", ") +
    (names.length > PREVIEW_NAMES ? ` +${names.length - PREVIEW_NAMES}` : "");

  return (
    <article
      className="animate-item flex flex-col gap-4 p-5 transition-colors hover:bg-surface-muted sm:flex-row sm:items-start"
      style={{ ["--i" as string]: index }}
    >
      <span
        className={`metric-icon shrink-0 ${sent ? "bg-success-soft text-success" : failed ? "bg-warning-soft text-warning" : "bg-info-soft text-info"}`}
      >
        {sent ? (
          <SendOutlinedIcon />
        ) : failed ? (
          <ErrorOutlineIcon />
        ) : (
          <ScheduleIcon />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusChip status={message.status} />
          {connectionName && (
            <Chip
              size="small"
              variant="outlined"
              icon={<HubOutlinedIcon />}
              label={connectionName}
            />
          )}
          <span className="text-xs text-muted">
            {t(
              sent ? "broadcasts.item.sentAt" : "broadcasts.item.scheduledFor",
              {
                date: formatDateTime(
                  sent ? message.sentAt : message.scheduledAt,
                ),
              },
            )}
          </span>
        </div>
        {/* O texto aparece resumido; o completo está em "Ver detalhes". */}
        <FormattedText text={message.body} className="line-clamp-3 text-ink" />
        <p className="mt-3 text-xs text-muted">
          {t("broadcasts.item.recipients", {
            names: summary,
            count: message.recipients.length,
          })}
        </p>
        <button
          type="button"
          className="mt-2 cursor-pointer text-xs font-bold text-brand hover:underline"
          onClick={() => onView(message)}
        >
          {t("broadcasts.item.viewDetails")}
        </button>
      </div>
      <div className="flex gap-1 self-end sm:self-start">
        <Tooltip title={t("broadcasts.item.viewDetails")}>
          <IconButton
            size="small"
            aria-label={t("broadcasts.viewAria")}
            onClick={() => onView(message)}
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("common.edit")}>
          <IconButton
            size="small"
            aria-label={t("broadcasts.editAria")}
            onClick={() => onEdit(message)}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("common.delete")}>
          <IconButton
            size="small"
            color="error"
            aria-label={t("broadcasts.deleteAria")}
            onClick={() => onDelete(message)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </article>
  );
}
