import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useNotify } from "../../../app/providers/NotificationProvider";
import { useResponsiveDialog } from "../../../components/ui/useResponsiveDialog";
import { FormTextField } from "../../../components/ui/FormTextField";
import { toLocalInputValue } from "../../../lib/dates";
import { useI18n } from "../../../i18n/I18nProvider";
import { useRevalidateOnLanguage } from "../../../i18n/useRevalidateOnLanguage";
import { getErrorMessage } from "../../../lib/errors";
import type { Contact, Message, Recipient } from "../../../types";
import {
  MESSAGE_MAX_LENGTH,
  messageSchema,
  type MessageFormValues,
} from "../schemas";
import { createMessage, updateMessage } from "../services/messagesService";
import { RecipientPicker } from "./RecipientPicker";

type MessageDialogProps = {
  /** `"new"` cria; uma mensagem edita; `null` mantém o diálogo fechado. */
  target: Message | "new" | null;
  connectionId: string;
  contacts: Contact[];
  onClose: () => void;
};

const emptyValues: MessageFormValues = {
  contactIds: [],
  body: "",
  mode: "now",
  scheduledAt: "",
};

const valuesFor = (message: Message | null): MessageFormValues =>
  message
    ? {
        contactIds: message.contactIds,
        body: message.body,
        mode: message.status === "scheduled" ? "scheduled" : "now",
        scheduledAt: message.scheduledAt
          ? toLocalInputValue(message.scheduledAt.toDate())
          : "",
      }
    : emptyValues;

export function MessageDialog({
  target,
  connectionId,
  contacts,
  onClose,
}: MessageDialogProps) {
  const { t } = useI18n();
  const notify = useNotify();
  const responsiveDialog = useResponsiveDialog();
  const editing = target && target !== "new" ? target : null;
  const alreadySent = editing?.status === "sent";

  const { control, handleSubmit, reset, watch, trigger, formState } =
    useForm<MessageFormValues>({
      resolver: zodResolver(messageSchema(t)),
      defaultValues: emptyValues,
    });

  // O mesmo diálogo serve para criar e editar: a cada abertura reinicio o
  // formulário com os valores da mensagem (ou vazio, se for nova).
  useEffect(() => {
    if (target) reset(valuesFor(editing));
  }, [target, editing, reset]);

  useRevalidateOnLanguage({ trigger, formState });

  const mode = watch("mode");
  const body = watch("body");

  // Contatos removidos continuam selecionáveis na edição, pelo snapshot salvo.
  const { choices, removedIds } = useMemo(() => {
    const available = new Set(contacts.map((contact) => contact.id));
    const removed: Recipient[] = (editing?.recipients ?? []).filter(
      (recipient) => !available.has(recipient.id),
    );
    return {
      choices: [...contacts, ...removed] as Recipient[],
      removedIds: new Set(removed.map((recipient) => recipient.id)),
    };
  }, [contacts, editing]);

  const submit = handleSubmit(async (values) => {
    try {
      if (editing) await updateMessage(editing.id, values);
      else await createMessage(connectionId, values);
      notify.success(
        editing
          ? t("broadcasts.toast.updated")
          : values.mode === "now"
            ? t("broadcasts.toast.sentSimulation")
            : t("broadcasts.toast.scheduled"),
      );
      onClose();
    } catch (cause) {
      notify.error(getErrorMessage(cause, t));
    }
  });

  const submitLabel = formState.isSubmitting
    ? t("common.saving")
    : editing
      ? t("broadcasts.dialog.saveChanges")
      : mode === "scheduled"
        ? t("broadcasts.dialog.schedule")
        : t("broadcasts.dialog.sendNow");

  return (
    <Dialog
      open={!!target}
      onClose={onClose}
      maxWidth="sm"
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
            ? t("broadcasts.dialog.editTitle")
            : t("broadcasts.dialog.newTitle")}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" fontSize={14} sx={{ mb: 2 }}>
            {t("broadcasts.dialog.hint")}
          </Typography>

          <Controller
            control={control}
            name="contactIds"
            render={({ field, fieldState }) => (
              <RecipientPicker
                choices={choices}
                removedIds={removedIds}
                value={field.value}
                error={fieldState.error?.message}
                onChange={field.onChange}
              />
            )}
          />

          <div className="mt-5">
            <FormTextField
              control={control}
              name="body"
              label={t("broadcasts.dialog.messageLabel")}
              multiline
              rows={4}
              fullWidth
              helperText={t("broadcasts.dialog.counter", {
                count: body.length,
                max: MESSAGE_MAX_LENGTH,
              })}
              slotProps={{ htmlInput: { maxLength: MESSAGE_MAX_LENGTH } }}
            />
          </div>

          <div className="mt-5">
            <p className="mb-1 text-sm font-bold">
              {t("broadcasts.dialog.whenTitle")}
            </p>
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <RadioGroup
                  row
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                >
                  <FormControlLabel
                    value="now"
                    control={<Radio />}
                    label={t("broadcasts.dialog.sendNow")}
                    disabled={alreadySent}
                  />
                  <FormControlLabel
                    value="scheduled"
                    control={<Radio />}
                    label={t("broadcasts.dialog.schedule")}
                    disabled={alreadySent}
                  />
                </RadioGroup>
              )}
            />
            {mode === "scheduled" && (
              <FormTextField
                control={control}
                name="scheduledAt"
                type="datetime-local"
                label={t("broadcasts.dialog.dateLabel")}
                fullWidth
                sx={{ mt: 1 }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: toLocalInputValue(new Date()) },
                }}
              />
            )}
            <Typography color="text.secondary" fontSize={12} sx={{ mt: 1 }}>
              {alreadySent
                ? t("broadcasts.dialog.noteSent")
                : t("broadcasts.dialog.noteSimulated")}
            </Typography>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={formState.isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formState.isSubmitting}
            startIcon={
              mode === "scheduled" ? <ScheduleIcon /> : <SendOutlinedIcon />
            }
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
