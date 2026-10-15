import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { useNotify } from "../../app/providers/NotificationProvider";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { getErrorMessage } from "../../lib/errors";
import type { Message, MessageStatus } from "../../types";
import { useCurrentUser } from "../auth/AuthProvider";
import { ConnectionSelect } from "../connections/components/ConnectionSelect";
import { useScopedConnection } from "../connections/components/ConnectionScope";
import { useContacts } from "../contacts/hooks/useContacts";
import { MessageDialog } from "./components/MessageDialog";
import { MessageItem } from "./components/MessageItem";
import { useMessageCounts } from "./hooks/useMessageCounts";
import { useMessages } from "./hooks/useMessages";
import { deleteMessage } from "./services/messagesService";

type Filter = "all" | MessageStatus;

const PAGE_SIZE = 20;

export function BroadcastsPage() {
  const user = useCurrentUser();
  const connection = useScopedConnection();
  const notify = useNotify();

  const [filter, setFilter] = useState<Filter>("all");
  const [max, setMax] = useState(PAGE_SIZE);
  const [dialogTarget, setDialogTarget] = useState<Message | "new" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);

  // O filtro vai para a consulta (não filtro no cliente), senão mensagens
  // agendadas mais antigas poderiam ficar de fora da página carregada.
  const { messages, loading, error } = useMessages(user.uid, connection.id, {
    status: filter === "all" ? undefined : filter,
    max,
  });
  const { contacts, loading: loadingContacts } = useContacts(
    user.uid,
    connection.id,
  );

  // Ao trocar de filtro ou de conexão, volto para a primeira página.
  useEffect(() => setMax(PAGE_SIZE), [filter, connection.id]);

  // Se veio uma página cheia, provavelmente existem mais mensagens.
  const hasMore = messages.length >= max;

  const refreshKey = messages
    .map((item) => `${item.id}:${item.status}`)
    .join("|");
  const counts = useMessageCounts(user.uid, connection.id, refreshKey);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMessage(deleteTarget.id);
      notify.success("Mensagem excluída.");
      setDeleteTarget(null);
    } catch (cause) {
      notify.error(getErrorMessage(cause));
    } finally {
      setDeleting(false);
    }
  };

  const noContacts = !loadingContacts && contacts.length === 0;
  const createAction = (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() => setDialogTarget("new")}
    >
      Nova mensagem
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Broadcast"
        description="Crie, programe e acompanhe suas mensagens."
        actions={
          <>
            <ConnectionSelect section="broadcasts" />
            {!noContacts && createAction}
          </>
        }
      />

      {noContacts && messages.length === 0 && !loading ? (
        <div className="surface">
          <EmptyState
            icon={<PeopleOutlineIcon sx={{ fontSize: 38 }} />}
            title="Adicione seus contatos"
            description="Cadastre pelo menos um contato para criar uma mensagem."
            action={
              <Button
                component={Link}
                to={`/connections/${connection.id}/contacts`}
                variant="contained"
              >
                Adicionar contato
              </Button>
            }
          />
        </div>
      ) : (
        <div className="surface">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <Typography variant="h6" component="h2">
                Mensagens
              </Typography>
              <Typography color="text.secondary" fontSize={13}>
                {counts.all ?? "–"} mensagem(ns) em {connection.name}
              </Typography>
            </div>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={filter}
              aria-label="Filtrar mensagens por status"
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
                Todas ({counts.all ?? "–"})
              </ToggleButton>
              <ToggleButton value="sent">
                Enviadas ({counts.sent ?? "–"})
              </ToggleButton>
              <ToggleButton value="scheduled">
                Agendadas ({counts.scheduled ?? "–"})
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
                  ? "Nenhuma mensagem criada"
                  : "Nenhuma mensagem neste filtro"
              }
              description={
                filter === "all"
                  ? "Crie uma mensagem e escolha entre enviar agora ou agendar."
                  : "Suas mensagens aparecerão aqui quando tiverem este status."
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
                    {loading ? "Carregando..." : "Carregar mais"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <MessageDialog
        target={dialogTarget}
        connectionId={connection.id}
        contacts={contacts}
        onClose={() => setDialogTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir mensagem"
        description={
          deleteTarget?.status === "scheduled"
            ? "Esta mensagem está agendada e não será enviada se for excluída."
            : "O registro desta mensagem será removido do histórico."
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
