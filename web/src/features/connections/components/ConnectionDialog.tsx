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
  const notify = useNotify();
  const editing = target && target !== "new" ? target : null;
  const { control, handleSubmit, reset, formState } =
    useForm<ConnectionFormValues>({
      resolver: zodResolver(connectionSchema),
      defaultValues: { name: "" },
    });

  useEffect(() => {
    if (target) reset({ name: editing?.name ?? "" });
  }, [target, editing, reset]);

  const submit = handleSubmit(async ({ name }) => {
    try {
      if (editing) await renameConnection(editing.id, name);
      else await createConnection(tenantId, name);
      notify.success(editing ? "Conexão atualizada." : "Conexão criada.");
      onClose();
    } catch (cause) {
      notify.error(getErrorMessage(cause));
    }
  });

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth="xs" fullWidth>
      <form
        onSubmit={submit}
        noValidate
        className="flex min-h-0 flex-1 flex-col"
      >
        <DialogTitle>{editing ? "Editar conexão" : "Nova conexão"}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" fontSize={14} sx={{ mb: 3 }}>
            Dê um nome para identificar esta conexão.
          </Typography>
          <FormTextField
            control={control}
            name="name"
            label="Nome da conexão"
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={formState.isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
