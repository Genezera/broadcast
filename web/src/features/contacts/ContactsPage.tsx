import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import SearchIcon from "@mui/icons-material/Search";
import { useNotify } from "../../app/providers/NotificationProvider";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { useI18n } from "../../i18n/I18nProvider";
import { getErrorMessage } from "../../lib/errors";
import type { Contact } from "../../types";
import { useCurrentUser } from "../auth/AuthProvider";
import { ConnectionSelect } from "../connections/components/ConnectionSelect";
import { useScopedConnection } from "../connections/components/ConnectionScope";
import { ContactDialog } from "./components/ContactDialog";
import { ContactsTable } from "./components/ContactsTable";
import { useContacts } from "./hooks/useContacts";
import { deleteContact } from "./services/contactsService";

export function ContactsPage() {
  const { t } = useI18n();
  const user = useCurrentUser();
  const connection = useScopedConnection();
  const notify = useNotify();
  const { contacts, loading, error } = useContacts(user.uid, connection.id);

  const [search, setSearch] = useState("");
  const [dialogTarget, setDialogTarget] = useState<Contact | "new" | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((contact) =>
      `${contact.name} ${contact.phone}`.toLowerCase().includes(term),
    );
  }, [contacts, search]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteContact(deleteTarget.id);
      notify.success(t("contacts.deleted"));
      setDeleteTarget(null);
    } catch (cause) {
      notify.error(getErrorMessage(cause, t));
    } finally {
      setDeleting(false);
    }
  };

  const addAction = (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() => setDialogTarget("new")}
    >
      {t("contacts.add")}
    </Button>
  );

  return (
    <>
      <PageHeader
        title={t("contacts.title")}
        description={t("contacts.subtitle")}
        actions={
          <>
            <ConnectionSelect section="contacts" />
            {contacts.length > 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogTarget("new")}
              >
                {t("contacts.new")}
              </Button>
            )}
          </>
        }
      />
      <div className="surface">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <Typography variant="h6" component="h2">
              {t("contacts.listTitle")}
            </Typography>
            <Typography color="text.secondary" fontSize={13}>
              {t("contacts.count", {
                count: contacts.length,
                connection: connection.name,
              })}
            </Typography>
          </div>
          <TextField
            placeholder={t("contacts.searchPlaceholder")}
            sx={{ width: { xs: "100%", sm: 280 } }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
              htmlInput: { "aria-label": t("contacts.searchAria") },
            }}
          />
        </div>
        <Divider />
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <ListSkeleton />
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={<PeopleOutlineIcon sx={{ fontSize: 38 }} />}
            title={t("contacts.emptyTitle")}
            description={t("contacts.emptyText")}
            action={addAction}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<SearchIcon sx={{ fontSize: 38 }} />}
            title={t("contacts.noResultsTitle")}
            description={t("contacts.noResultsText")}
          />
        ) : (
          <ContactsTable
            contacts={filtered}
            onEdit={setDialogTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <ContactDialog
        target={dialogTarget}
        tenantId={user.uid}
        connectionId={connection.id}
        onClose={() => setDialogTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title={t("contacts.deleteTitle")}
        description={t("contacts.deleteConfirm", {
          name: deleteTarget?.name ?? "",
        })}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
