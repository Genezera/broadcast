import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { StatusChip } from "../../../components/ui/StatusChip";
import { formatDateTime } from "../../../lib/dates";
import type { Message } from "../../../types";

type MessageItemProps = {
  message: Message;
  /** Posição na lista; define o atraso da animação de entrada. */
  index: number;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
};

export function MessageItem({
  message,
  index,
  onEdit,
  onDelete,
}: MessageItemProps) {
  const scheduled = message.status === "scheduled";
  return (
    <article
      className="animate-item flex flex-col gap-4 p-5 transition-colors hover:bg-[#fcfcfe] sm:flex-row sm:items-start"
      style={{ ["--i" as string]: index }}
    >
      <span
        className={`metric-icon shrink-0 ${scheduled ? "bg-info-soft text-info" : "bg-success-soft text-success"}`}
      >
        {scheduled ? <ScheduleIcon /> : <SendOutlinedIcon />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusChip status={message.status} />
          <span className="text-xs text-muted">
            {scheduled ? "Para" : "Em"}{" "}
            {formatDateTime(scheduled ? message.scheduledAt : message.sentAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words text-ink">
          {message.body}
        </p>
        <p className="mt-3 text-xs text-muted">
          Para{" "}
          {message.recipients.map((recipient) => recipient.name).join(", ")} ·{" "}
          {message.recipients.length} contato(s)
        </p>
      </div>
      <div className="flex gap-1 self-end sm:self-start">
        <Tooltip title="Editar">
          <IconButton
            size="small"
            aria-label="Editar mensagem"
            onClick={() => onEdit(message)}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            size="small"
            color="error"
            aria-label="Excluir mensagem"
            onClick={() => onDelete(message)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </article>
  );
}
