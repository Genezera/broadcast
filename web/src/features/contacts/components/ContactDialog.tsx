import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { useNotify } from "../../../app/providers/NotificationProvider";
import { FormTextField } from "../../../components/ui/FormTextField";
import { getErrorMessage } from "../../../lib/errors";
import type { Contact } from "../../../types";
import { contactSchema, type ContactFormValues } from "../schemas";
import { createContact, updateContact } from "../services/contactsService";

type ContactDialogProps = {
  /** `"new"` cria; um contato edita; `null` mantém o diálogo fechado. */
  target: Contact | "new" | null;
  tenantId: string;
  connectionId: string;
  onClose: () => void;
};

export function ContactDialog({
  target,
  tenantId,
  connectionId,
  onClose,
}: ContactDialogProps) {
  const notify = useNotify();
  const editing = target && target !== "new" ? target : null;
  const { control, handleSubmit, reset, formState } =
    useForm<ContactFormValues>({
      resolver: zodResolver(contactSchema),
      defaultValues: { name: "", phone: "" },
    });

  useEffect(() => {
    if (target) {
      reset({ name: editing?.name ?? "", phone: editing?.phone ?? "" });
    }
  }, [target, editing, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      if (editing) await updateContact(editing.id, values);
      else await createContact({ ...values, tenantId, connectionId });
      notify.success(editing ? "Contato atualizado." : "Contato criado.");
      onClose();
    } catch (cause) {
      notify.error(getErrorMessage(cause));
    }
  });

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={submit} noValidate>
        <DialogTitle>{editing ? "Editar contato" : "Novo contato"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormTextField
              control={control}
              name="name"
              label="Nome"
              fullWidth
              autoFocus
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <FormTextField
              control={control}
              name="phone"
              label="Telefone"
              fullWidth
              placeholder="+55 11 99999-9999"
              slotProps={{ htmlInput: { maxLength: 24, inputMode: "tel" } }}
            />
          </Stack>
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
