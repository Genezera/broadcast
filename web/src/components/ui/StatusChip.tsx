import { Chip } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import type { MessageStatus } from "../../types";

const STATUS = {
  sent: {
    label: "Enviada",
    icon: <CheckCircleOutlineIcon />,
    className: "bg-success-soft text-success",
  },
  scheduled: {
    label: "Agendada",
    icon: <ScheduleIcon />,
    className: "bg-info-soft text-info",
  },
} as const;

export function StatusChip({ status }: { status: MessageStatus }) {
  const { label, icon, className } = STATUS[status];
  // key = status: ao mudar, o chip é recriado e a animação de entrada toca
  // de novo, chamando atenção para a mudança feita pelo backend.
  return (
    <Chip
      key={status}
      size="small"
      icon={icon}
      label={label}
      className={`animate-pop ${className}`}
      sx={{ "& .MuiChip-icon": { color: "inherit" } }}
    />
  );
}
