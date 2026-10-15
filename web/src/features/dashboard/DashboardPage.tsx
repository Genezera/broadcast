import { useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { EmptyState } from "../../components/ui/EmptyState";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusChip } from "../../components/ui/StatusChip";
import { formatDateTime } from "../../lib/dates";
import { useCurrentUser } from "../auth/AuthProvider";
import { useRecentMessages } from "../broadcasts/hooks/useMessages";
import { useConnectionsContext } from "../connections/ConnectionsProvider";
import { useDashboardCounts } from "./hooks/useDashboardCounts";

type Metric = {
  label: string;
  /** `null` enquanto a contagem ainda está sendo carregada. */
  value: number | null;
  icon: ReactNode;
  className: string;
  to: string;
};

const RECENT_LIMIT = 5;

export function DashboardPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const {
    activeConnections,
    connections,
    loading: loadingConnections,
  } = useConnectionsContext();
  const {
    messages,
    loading: loadingMessages,
    error,
  } = useRecentMessages(user.uid, RECENT_LIMIT);

  // As mensagens recentes chegam em tempo real; uso a "assinatura" delas
  // (id + status + atualização) para pedir uma nova contagem quando mudam.
  const refreshKey = messages
    .map((item) => `${item.id}:${item.status}:${item.updatedAt?.toMillis()}`)
    .join("|");
  const counts = useDashboardCounts(user.uid, refreshKey);

  const metrics = useMemo<Metric[]>(
    () => [
      {
        label: "Conexões",
        value: loadingConnections ? null : activeConnections.length,
        icon: <HubOutlinedIcon />,
        className: "bg-brand-soft text-brand",
        to: "/connections",
      },
      {
        label: "Contatos",
        value: counts.contacts,
        icon: <PeopleOutlineIcon />,
        className: "bg-success-soft text-success",
        to: "/contacts",
      },
      {
        label: "Enviadas",
        value: counts.sent,
        icon: <SendOutlinedIcon />,
        className: "bg-warning-soft text-warning",
        to: "/broadcasts",
      },
      {
        label: "Agendadas",
        value: counts.scheduled,
        icon: <ScheduleIcon />,
        className: "bg-info-soft text-info",
        to: "/broadcasts",
      },
    ],
    [activeConnections, loadingConnections, counts],
  );

  const connectionNames = useMemo(
    () => new Map(connections.map((item) => [item.id, item.name])),
    [connections],
  );
  const hasConnections = activeConnections.length > 0;

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Acompanhe sua comunicação em um só lugar."
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <div className="surface animate-pop mb-6 flex flex-wrap items-center justify-between gap-4 !border-0 bg-gradient-to-r from-[#6253e8] to-[#8779f5] p-6 text-white lg:p-8">
        <div>
          <p className="mb-2 text-sm font-bold uppercase text-[#e8e4ff]">
            Seu espaço de comunicação
          </p>
          <h2 className="mb-2 font-display text-2xl font-extrabold lg:text-3xl">
            Tudo pronto para se conectar?
          </h2>
          <p className="text-[#ebe8ff]">
            Crie uma conexão, organize contatos e envie sua primeira mensagem.
          </p>
        </div>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{
            bgcolor: "white",
            color: "primary.main",
            "&:hover": { bgcolor: "#f5f3ff" },
          }}
          onClick={() =>
            navigate(hasConnections ? "/broadcasts" : "/connections")
          }
        >
          {hasConnections ? "Criar mensagem" : "Criar conexão"}
        </Button>
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <Link
            key={metric.label}
            to={metric.to}
            className="surface animate-item hover-lift p-5 text-left"
            style={{ ["--i" as string]: index }}
          >
            <div className="flex items-start justify-between">
              <span className={`metric-icon ${metric.className}`}>
                {metric.icon}
              </span>
              <ArrowForwardIcon sx={{ fontSize: 17, color: "#b8bac8" }} />
            </div>
            <p className="mt-5 font-display text-3xl font-extrabold">
              <AnimatedNumber value={metric.value} />
            </p>
            <p className="mt-1 text-sm text-muted">{metric.label}</p>
          </Link>
        ))}
      </div>

      <section className="surface p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <Typography variant="h6" component="h2">
              Mensagens recentes
            </Typography>
            <Typography color="text.secondary" fontSize={13}>
              De todas as suas conexões
            </Typography>
          </div>
          <Button
            component={Link}
            to="/broadcasts"
            endIcon={<ArrowForwardIcon />}
          >
            Ver todas
          </Button>
        </div>
        {loadingMessages || loadingConnections ? (
          <ListSkeleton rows={3} />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<CampaignOutlinedIcon sx={{ fontSize: 36 }} />}
            title="Nenhuma mensagem ainda"
            description="As mensagens enviadas e agendadas aparecerão aqui."
          />
        ) : (
          <div>
            {messages.slice(0, RECENT_LIMIT).map((message, index) => {
              const sent = message.status === "sent";
              return (
                <div
                  key={message.id}
                  className="animate-item flex items-center gap-4 border-t border-line py-4"
                  style={{ ["--i" as string]: index }}
                >
                  <span
                    className={`metric-icon !h-10 !w-10 ${sent ? "bg-success-soft text-success" : "bg-info-soft text-info"}`}
                  >
                    {sent ? (
                      <CheckCircleOutlineIcon fontSize="small" />
                    ) : (
                      <ScheduleIcon fontSize="small" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{message.body}</p>
                    <p className="text-xs text-muted">
                      {connectionNames.get(message.connectionId) ?? "Conexão"} ·{" "}
                      {message.recipients.length} destinatário(s) ·{" "}
                      {formatDateTime(
                        sent ? message.sentAt : message.scheduledAt,
                      )}
                    </p>
                  </div>
                  <StatusChip status={message.status} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
