import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import { useNotify } from "../../app/providers/NotificationProvider";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { CardGridSkeleton } from "../../components/ui/ListSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useI18n } from "../../i18n/I18nProvider";
import { getErrorMessage } from "../../lib/errors";
import type { Connection } from "../../types";
import { useCurrentUser } from "../auth/AuthProvider";
import { ConnectionCard } from "./components/ConnectionCard";
import { ConnectionDialog } from "./components/ConnectionDialog";
import { useConnectionsContext } from "./ConnectionsProvider";
import { deleteConnection } from "./services/connectionsService";

export function ConnectionsPage() {
  const { t } = useI18n();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const notify = useNotify();
  const { connections, loading, error } = useConnectionsContext();

  const [dialogTarget, setDialogTarget] = useState<Connection | "new" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteConnection(deleteTarget.id);
      notify.success(t("connections.deleted"));
      setDeleteTarget(null);
    } catch (cause) {
      notify.error(getErrorMessage(cause, t));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("connections.title")}
        description={t("connections.subtitle")}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogTarget("new")}
          >
            {t("connections.new")}
          </Button>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <div className="surface">
        {loading ? (
          <CardGridSkeleton />
        ) : connections.length === 0 ? (
          <EmptyState
            icon={<HubOutlinedIcon sx={{ fontSize: 38 }} />}
            title={t("connections.emptyTitle")}
            description={t("connections.emptyText")}
            action={
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogTarget("new")}
              >
                {t("connections.create")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-3">
            {connections.map((connection, index) => (
              <ConnectionCard
                key={connection.id}
                index={index}
                connection={connection}
                onEdit={setDialogTarget}
                onDelete={setDeleteTarget}
                onOpen={(item) => navigate(`/connections/${item.id}/contacts`)}
              />
            ))}
          </div>
        )}
      </div>

      <ConnectionDialog
        target={dialogTarget}
        tenantId={user.uid}
        onClose={() => setDialogTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title={t("connections.deleteTitle")}
        description={t("connections.deleteConfirm", {
          name: deleteTarget?.name ?? "",
        })}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
