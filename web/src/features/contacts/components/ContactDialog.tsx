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
import { useResponsiveDialog } from "../../../components/ui/useResponsiveDialog";
import { FormPhoneField } from "../../../components/ui/FormPhoneField";
import { FormTextField } from "../../../components/ui/FormTextField";
import { useI18n } from "../../../i18n/I18nProvider";
import { useRevalidateOnLanguage } from "../../../i18n/useRevalidateOnLanguage";
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
  const { t } = useI18n();
  const notify = useNotify();
  const responsiveDialog = useResponsiveDialog();
  const editing = target && target !== "new" ? target : null;
  const { control, handleSubmit, reset, trigger, formState } =
    useForm<ContactFormValues>({
      resolver: zodResolver(contactSchema(t)),
      defaultValues: { name: "", phone: "" },
    });

  useEffect(() => {
    if (target) {
      reset({ name: editing?.name ?? "", phone: editing?.phone ?? "" });
    }
  }, [target, editing, reset]);

  useRevalidateOnLanguage({ trigger, formState });

  const submit = handleSubmit(async (values) => {
    try {
      if (editing) await updateContact(editing.id, values);
      else await createContact({ ...values, tenantId, connectionId });
      notify.success(editing ? t("contacts.updated") : t("contacts.created"));
      onClose();
    } catch (cause) {
      notify.error(getErrorMessage(cause, t));
    }
  });

  return (
    <Dialog
      open={!!target}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      {...responsiveDialog}
    >
      <form
        onSubmit={submit}
        noValidate
        className="flex min-h-0 flex-1 flex-col"
      >
        <DialogTitle>
          {editing
            ? t("contacts.dialog.editTitle")
            : t("contacts.dialog.newTitle")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormTextField
              control={control}
              name="name"
              label={t("contacts.dialog.nameLabel")}
              fullWidth
              autoFocus
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
            <FormPhoneField
              control={control}
              name="phone"
              label={t("contacts.dialog.phoneLabel")}
            />
          </Stack>
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
