import { Chip } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { useT } from "../../i18n/I18nProvider";
import type { MessageStatus } from "../../types";

const STATUS = {
  sent: {
    icon: <CheckCircleOutlineIcon />,
    className: "bg-success-soft text-success",
  },
  scheduled: {
    icon: <ScheduleIcon />,
    className: "bg-info-soft text-info",
  },
  failed: {
    icon: <ErrorOutlineIcon />,
    className: "bg-warning-soft text-warning",
  },
} as const;

export function StatusChip({ status }: { status: MessageStatus }) {
  const t = useT();
  const { icon, className } = STATUS[status];
  // key = status: ao mudar, o chip é recriado e a animação de entrada toca
  // de novo, chamando atenção para a mudança feita pelo backend.
  return (
    <Chip
      key={status}
      size="small"
      icon={icon}
      label={t(`status.${status}`)}
      className={`animate-pop ${className}`}
      sx={{ "& .MuiChip-icon": { color: "inherit" } }}
    />
  );
}
