import { lazy, Suspense, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useNotify } from "../../../app/providers/NotificationProvider";
import { useResponsiveDialog } from "../../../components/ui/useResponsiveDialog";
import { toLocalInputValue } from "../../../lib/dates";
import { useI18n } from "../../../i18n/I18nProvider";
import { useRevalidateOnLanguage } from "../../../i18n/useRevalidateOnLanguage";
import { getErrorMessage } from "../../../lib/errors";
import type { Connection, Message, Recipient } from "../../../types";
import { useCurrentUser } from "../../auth/AuthProvider";
import { useContacts } from "../../contacts/hooks/useContacts";
import { announce } from "../../notifications/announced";
import {
  MESSAGE_MAX_LENGTH,
  messageSchema,
  type MessageFormValues,
} from "../schemas";
import { createMessage, updateMessage } from "../services/messagesService";
import { ConnectionPicker } from "./ConnectionPicker";
import { MessageEditor } from "./MessageEditor";
import { RecipientPicker } from "./RecipientPicker";

// O calendário só é baixado quando alguém escolhe agendar.
const ScheduleField = lazy(() => import("./ScheduleField"));

type MessageDialogProps = {
  /** `"new"` cria; uma mensagem edita; `null` mantém o diálogo fechado. */
  target: Message | "new" | null;
  /** Conexões ativas do cliente. */
  connections: Connection[];
  /** Conexão sugerida ao criar (a do filtro da tela, se houver). */
  defaultConnectionId?: string;
  onClose: () => void;
};

const valuesFor = (
  message: Message | null,
  connections: Connection[],
  defaultConnectionId?: string,
): MessageFormValues => {
  const firstId = defaultConnectionId ?? connections[0]?.id ?? "";
  return message
    ? {
        audience: "contacts",
        connectionId: message.connectionId,
        contactIds: message.contactIds,
        connectionIds: [],
        body: message.body,
        mode: message.status === "scheduled" ? "scheduled" : "now",
        scheduledAt: message.scheduledAt
          ? toLocalInputValue(message.scheduledAt.toDate())
          : "",
      }
    : {
        audience: "contacts",
        connectionId: firstId,
        contactIds: [],
        connectionIds: firstId ? [firstId] : [],
        body: "",
        mode: "now",
        scheduledAt: "",
      };
};

export function MessageDialog({
  target,
  connections,
  defaultConnectionId,
  onClose,
}: MessageDialogProps) {
  const { t } = useI18n();
  const user = useCurrentUser();
  const notify = useNotify();
  const responsiveDialog = useResponsiveDialog();
  const editing = target && target !== "new" ? target : null;
  const alreadySent = editing?.status === "sent";

  // Ao editar uma agendada, o horário que ela já tem continua válido.
  const originalSchedule =
    editing?.status === "scheduled" && editing.scheduledAt
      ? toLocalInputValue(editing.scheduledAt.toDate())
      : "";

  const { control, handleSubmit, reset, watch, setValue, trigger, formState } =
    useForm<MessageFormValues>({
      resolver: zodResolver(messageSchema(t, originalSchedule)),
      defaultValues: valuesFor(null, connections, defaultConnectionId),
    });

  // O mesmo diálogo serve para criar e editar: a cada abertura reinicio o
  // formulário com os valores da mensagem (ou vazio, se for nova).
  useEffect(() => {
    if (target) reset(valuesFor(editing, connections, defaultConnectionId));
    // `connections` muda sempre que o Firestore atualiza; só a abertura reinicia.
  }, [target, reset]);

  useRevalidateOnLanguage({ trigger, formState });

  const audience = watch("audience");
  const connectionId = watch("connectionId");
  const mode = watch("mode");

  // Contatos da conexão escolhida (em tempo real).
  const { contacts } = useContacts(user.uid, connectionId || "none");

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

  const connectionName =
    connections.find((connection) => connection.id === connectionId)?.name ??
    "";

  const submit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateMessage(editing.id, values);
        notify.success(t("broadcasts.toast.updated"));
      } else {
        const result = await createMessage(values).then((r) => r.data);
        // O aviso de "enviada" já sai daqui: marco os IDs para a notificação
        // em tempo real não repetir o toast (ela continua indo para o sino).
        if (values.mode === "now") announce(result.ids);
        const params = {
          count: result.recipientCount,
          connections: result.connectionCount,
        };
        notify.success(
          values.mode === "now"
            ? result.connectionCount > 1
              ? t("broadcasts.toast.sentMulti", params)
              : t("broadcasts.toast.sent", params)
            : result.connectionCount > 1
              ? t("broadcasts.toast.scheduledMulti", params)
              : t("broadcasts.toast.scheduled"),
        );
      }
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

          {/* Alcance: só ao criar. Editar mantém a conexão da mensagem. */}
          {!editing && (
            <div className="mb-4">
              <p className="mb-1.5 text-sm font-bold">
                {t("broadcasts.dialog.audienceLabel")}
              </p>
              <Controller
                control={control}
                name="audience"
                render={({ field }) => (
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    color="primary"
                    value={field.value}
                    aria-label={t("broadcasts.dialog.audienceLabel")}
                    onChange={(_, value) => value && field.onChange(value)}
                  >
                    <ToggleButton value="contacts" sx={{ gap: 1 }}>
                      <PersonOutlineIcon fontSize="small" />
                      {t("broadcasts.dialog.audienceContacts")}
                    </ToggleButton>
                    <ToggleButton value="connections" sx={{ gap: 1 }}>
                      <HubOutlinedIcon fontSize="small" />
                      {t("broadcasts.dialog.audienceConnections")}
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              />
            </div>
          )}

          {audience === "contacts" ? (
            <>
              {editing ? (
                <p className="mb-3 text-sm text-subtle">
                  {t("broadcasts.dialog.connectionOf")}{" "}
                  <Chip size="small" label={connectionName || "—"} />
                </p>
              ) : (
                <Controller
                  control={control}
                  name="connectionId"
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      disableClearable
                      options={connections}
                      sx={{ mb: 2 }}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      value={
                        connections.find(
                          (item) => item.id === field.value,
                        ) as Connection
                      }
                      onChange={(_, option) => {
                        field.onChange(option.id);
                        // Os contatos marcados eram da conexão anterior.
                        setValue("contactIds", []);
                      }}
                      noOptionsText={t("broadcasts.dialog.noResults")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t("broadcasts.dialog.connectionLabel")}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
              )}
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
            </>
          ) : (
            <>
              <Controller
                control={control}
                name="connectionIds"
                render={({ field, fieldState }) => (
                  <ConnectionPicker
                    connections={connections}
                    value={field.value}
                    error={fieldState.error?.message}
                    onChange={field.onChange}
                  />
                )}
              />
              <Typography color="text.secondary" fontSize={12} sx={{ mt: 1 }}>
                {t("broadcasts.dialog.connectionsHint")}
              </Typography>
            </>
          )}

          <div className="mt-5">
            <Controller
              control={control}
              name="body"
              render={({ field, fieldState }) => (
                <MessageEditor
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  maxLength={MESSAGE_MAX_LENGTH}
                />
              )}
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
              <div className="mt-2">
                <Controller
                  control={control}
                  name="scheduledAt"
                  render={({ field, fieldState }) => (
                    <Suspense
                      fallback={
                        <TextField
                          fullWidth
                          disabled
                          label={t("broadcasts.dialog.dateLabel")}
                        />
                      }
                    >
                      <ScheduleField
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    </Suspense>
                  )}
                />
              </div>
            )}
            {alreadySent && (
              <Typography color="text.secondary" fontSize={12} sx={{ mt: 1 }}>
                {t("broadcasts.dialog.noteSent")}
              </Typography>
            )}
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
