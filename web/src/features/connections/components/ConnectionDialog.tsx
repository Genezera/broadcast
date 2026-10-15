import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { FormTextField } from "../../../components/ui/FormTextField";
import { useNotify } from "../../../app/providers/NotificationProvider";
import { useI18n } from "../../../i18n/I18nProvider";
import { useRevalidateOnLanguage } from "../../../i18n/useRevalidateOnLanguage";
import { getErrorMessage } from "../../../lib/errors";
import type { Connection } from "../../../types";
import { connectionSchema, type ConnectionFormValues } from "../schemas";
import {
  createConnection,
  renameConnection,
} from "../services/connectionsService";

type ConnectionDialogProps = {
  /** `"new"` cria; uma conexão edita; `null` mantém o diálogo fechado. */
  target: Connection | "new" | null;
  tenantId: string;
  onClose: () => void;
};

export function ConnectionDialog({
  target,
  tenantId,
  onClose,
}: ConnectionDialogProps) {
  const { t } = useI18n();
  const notify = useNotify();
  const editing = target && target !== "new" ? target : null;
  const { control, handleSubmit, reset, trigger, formState } =
    useForm<ConnectionFormValues>({
      resolver: zodResolver(connectionSchema(t)),
      defaultValues: { name: "" },
    });

  useEffect(() => {
    if (target) reset({ name: editing?.name ?? "" });
  }, [target, editing, reset]);

  useRevalidateOnLanguage({ trigger, formState });

  const submit = handleSubmit(async ({ name }) => {
    try {
      if (editing) await renameConnection(editing.id, name);
      else await createConnection(tenantId, name);
      notify.success(
        editing ? t("connections.updated") : t("connections.created"),
      );
      onClose();
    } catch (cause) {
      notify.error(getErrorMessage(cause, t));
    }
  });

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={submit}
        noValidate
        className="flex min-h-0 flex-1 flex-col"
      >
        <DialogTitle>
          {editing
            ? t("connections.dialog.editTitle")
            : t("connections.dialog.newTitle")}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" fontSize={14} sx={{ mb: 3 }}>
            {t("connections.dialog.hint")}
          </Typography>
          <FormTextField
            control={control}
            name="name"
            label={t("connections.dialog.nameLabel")}
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={formState.isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? t("common.saving") : t("common.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
