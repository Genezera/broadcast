import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Divider,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import { useNotify } from "../../app/providers/NotificationProvider";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { Loading } from "../../components/ui/Loading";
import { PageHeader } from "../../components/ui/PageHeader";
import { useI18n } from "../../i18n/I18nProvider";
import { getErrorMessage } from "../../lib/errors";
import type { Message, MessageStatus } from "../../types";
import { useCurrentUser } from "../auth/AuthProvider";
import { useConnectionsContext } from "../connections/ConnectionsProvider";
import { MessageDetailDialog } from "./components/MessageDetailDialog";
import { MessageDialog } from "./components/MessageDialog";
import { MessageItem } from "./components/MessageItem";
import { useMessageCounts } from "./hooks/useMessageCounts";
import { useMessages } from "./hooks/useMessages";
import { deleteMessage } from "./services/messagesService";

type Filter = "all" | MessageStatus;

const PAGE_SIZE = 20;
const ALL_CONNECTIONS = "all";

/**
 * Todas as mensagens do cliente. O filtro de conexão ("Todas" ou uma delas)
 * fica na URL (`?connection=<id>`), então dá para compartilhar ou voltar a
 * uma conexão específica.
 */
export function BroadcastsPage() {
  const { t } = useI18n();
  const user = useCurrentUser();
  const notify = useNotify();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    connections,
    activeConnections,
    loading: loadingConnections,
  } = useConnectionsContext();

  const requested = searchParams.get("connection");
  // Um ID que não é de uma conexão do cliente cai em "todas".
  const connectionId = connections.some((item) => item.id === requested)
    ? (requested ?? undefined)
    : undefined;

  const [filter, setFilter] = useState<Filter>("all");
  const [max, setMax] = useState(PAGE_SIZE);
  const [dialogTarget, setDialogTarget] = useState<Message | "new" | null>(
    null,
  );
  const [viewTarget, setViewTarget] = useState<Message | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);

  // O filtro vai para a consulta (não filtro no cliente), senão mensagens
  // agendadas mais antigas poderiam ficar de fora da página carregada.
  const { messages, loading, error } = useMessages(user.uid, {
    connectionId,
    status: filter === "all" ? undefined : filter,
    max,
  });

  // Ao trocar de filtro ou de conexão, volto para a primeira página.
  useEffect(() => setMax(PAGE_SIZE), [filter, connectionId]);

  // Se veio uma página cheia, provavelmente existem mais mensagens.
  const hasMore = messages.length >= max;

  const refreshKey = messages
    .map((item) => `${item.id}:${item.status}`)
    .join("|");
  const counts = useMessageCounts(user.uid, connectionId, refreshKey);

  const connectionNames = useMemo(
    () => new Map(connections.map((item) => [item.id, item.name])),
    [connections],
  );

  const changeConnection = (value: string) =>
    setSearchParams(value === ALL_CONNECTIONS ? {} : { connection: value }, {
      replace: true,
    });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMessage(deleteTarget.id);
      notify.success(t("broadcasts.deleted"));
      setDeleteTarget(null);
    } catch (cause) {
      notify.error(getErrorMessage(cause, t));
    } finally {
      setDeleting(false);
    }
  };

  if (loadingConnections) return <Loading />;

  if (connections.length === 0) {
    return (
      <>
        <PageHeader
          title={t("broadcasts.title")}
          description={t("broadcasts.subtitle")}
        />
        <div className="surface">
          <EmptyState
            icon={<HubOutlinedIcon sx={{ fontSize: 38 }} />}
            title={t("connections.createFirstTitle")}
            description={t("connections.createFirstMessages")}
            action={
              <Button component={Link} to="/connections" variant="contained">
                {t("connections.goToConnections")}
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const createAction = (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      disabled={activeConnections.length === 0}
      onClick={() => setDialogTarget("new")}
    >
      {t("broadcasts.new")}
    </Button>
  );

  const scopeName = connectionId
    ? (connectionNames.get(connectionId) ?? "")
    : t("broadcasts.allConnections");

  return (
    <>
      <PageHeader
        title={t("broadcasts.title")}
        description={t("broadcasts.subtitle")}
        actions={
          <>
            <TextField
              select
              value={connectionId ?? ALL_CONNECTIONS}
              onChange={(event) => changeConnection(event.target.value)}
              className="min-w-0 flex-1 sm:flex-none"
              sx={{ minWidth: { sm: 210 } }}
              slotProps={{
                htmlInput: {
                  "aria-label": t("broadcasts.connectionFilterAria"),
                },
              }}
            >
              <MenuItem value={ALL_CONNECTIONS}>
                {t("broadcasts.allConnections")}
              </MenuItem>
              {connections.map((connection) => (
                <MenuItem key={connection.id} value={connection.id}>
                  {connection.name}
                </MenuItem>
              ))}
            </TextField>
            {createAction}
          </>
        }
      />

      <div className="surface">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <Typography variant="h6" component="h2">
              {t("broadcasts.listTitle")}
            </Typography>
            <Typography color="text.secondary" fontSize={13}>
              {connectionId
                ? t("broadcasts.count", {
                    count: counts.all ?? 0,
                    connection: scopeName,
                  })
                : t("broadcasts.countAll", { count: counts.all ?? 0 })}
            </Typography>
          </div>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            aria-label={t("broadcasts.filterAria")}
            sx={{
              width: { xs: "100%", sm: "auto" },
              "& .MuiToggleButton-root": {
                flex: { xs: 1, sm: "none" },
                px: { xs: 0.5, sm: 2 },
                whiteSpace: "nowrap",
                fontSize: { xs: 12, sm: 14 },
              },
            }}
            onChange={(_, value: Filter | null) => value && setFilter(value)}
          >
            <ToggleButton value="all">
              {t("broadcasts.filterAll", { count: counts.all ?? "–" })}
            </ToggleButton>
            <ToggleButton value="sent">
              {t("broadcasts.filterSent", { count: counts.sent ?? "–" })}
            </ToggleButton>
            <ToggleButton value="scheduled">
              {t("broadcasts.filterScheduled", {
                count: counts.scheduled ?? "–",
              })}
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <Divider />
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        {loading && messages.length === 0 ? (
          <ListSkeleton />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<CampaignOutlinedIcon sx={{ fontSize: 38 }} />}
            title={
              filter === "all"
                ? t("broadcasts.emptyTitle")
                : t("broadcasts.emptyFilterTitle")
            }
            description={
              filter === "all"
                ? t("broadcasts.emptyText")
                : t("broadcasts.emptyFilterText")
            }
            action={filter === "all" ? createAction : undefined}
          />
        ) : (
          <>
            <div className="divide-y divide-line">
              {messages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  index={index}
                  message={message}
                  // Só mostra a conexão quando a lista mistura várias.
                  connectionName={
                    connectionId
                      ? undefined
                      : connectionNames.get(message.connectionId)
                  }
                  onView={setViewTarget}
                  onEdit={setDialogTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center border-t border-line p-4">
                <Button
                  disabled={loading}
                  onClick={() => setMax((current) => current + PAGE_SIZE)}
                >
                  {loading ? t("common.loadingMore") : t("common.loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <MessageDialog
        target={dialogTarget}
        connections={activeConnections}
        defaultConnectionId={connectionId}
        onClose={() => setDialogTarget(null)}
      />
      <MessageDetailDialog
        message={viewTarget}
        connectionName={
          viewTarget ? (connectionNames.get(viewTarget.connectionId) ?? "") : ""
        }
        onEdit={setDialogTarget}
        onClose={() => setViewTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title={t("broadcasts.deleteTitle")}
        description={
          deleteTarget?.status === "scheduled"
            ? t("broadcasts.deleteScheduled")
            : t("broadcasts.deleteSent")
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
