import { useMemo, useRef, useState } from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { Flag } from "../../../components/ui/Flag";
import { FormattedText } from "../../../components/ui/FormattedText";
import { StatusChip } from "../../../components/ui/StatusChip";
import { useResponsiveDialog } from "../../../components/ui/useResponsiveDialog";
import { useI18n } from "../../../i18n/I18nProvider";
import { displayPhone, phoneCountry } from "../../../lib/phone";
import type { Message } from "../../../types";

type MessageDetailDialogProps = {
  message: Message | null;
  connectionName: string;
  onEdit: (message: Message) => void;
  onClose: () => void;
};

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Mensagem completa (com a formatação) e a lista de todos os destinatários. */
export function MessageDetailDialog({
  message: current,
  connectionName,
  onEdit,
  onClose,
}: MessageDetailDialogProps) {
  // Guardo a última mensagem aberta: durante a animação de fechar o conteúdo
  // continua na tela, em vez de sumir de uma vez.
  const last = useRef(current);
  if (current) last.current = current;
  const message = current ?? last.current;
  const { t, formatDateTime } = useI18n();
  const responsiveDialog = useResponsiveDialog();
  const [query, setQuery] = useState("");

  const recipients = useMemo(() => {
    const needle = normalize(query.trim());
    const numbers = needle.replace(/\D/g, "");
    return (message?.recipients ?? []).filter(
      (recipient) =>
        !needle ||
        normalize(recipient.name).includes(needle) ||
        (numbers.length > 0 &&
          recipient.phone.replace(/\D/g, "").includes(numbers)),
    );
  }, [message, query]);

  const scheduled = message?.status === "scheduled";

  return (
    <Dialog
      open={!!current}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      // Limpa a busca só depois que o diálogo termina de fechar.
      slotProps={{ transition: { onExited: () => setQuery("") } }}
      {...responsiveDialog}
    >
      <DialogTitle>{t("broadcasts.detail.title")}</DialogTitle>
      <DialogContent>
        {message && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={message.status} />
              <Chip
                size="small"
                variant="outlined"
                icon={<HubOutlinedIcon />}
                label={connectionName || "—"}
              />
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-subtle sm:grid-cols-2">
              <div>
                <dt className="inline font-bold">
                  {t("broadcasts.detail.created")}:{" "}
                </dt>
                <dd className="inline">{formatDateTime(message.createdAt)}</dd>
              </div>
              <div>
                <dt className="inline font-bold">
                  {scheduled
                    ? t("broadcasts.detail.scheduledFor")
                    : t("broadcasts.detail.sentAt")}
                  :{" "}
                </dt>
                <dd className="inline">
                  {formatDateTime(
                    scheduled ? message.scheduledAt : message.sentAt,
                  )}
                </dd>
              </div>
            </dl>

            <section>
              <h3 className="mb-1.5 text-sm font-bold">
                {t("broadcasts.detail.message")}
              </h3>
              {/* Mensagens longas rolam dentro da caixa, sem esticar o diálogo. */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-line bg-surface-muted p-4 text-sm">
                <FormattedText text={message.body} />
              </div>
            </section>

            <section>
              <h3 className="mb-1.5 text-sm font-bold">
                {t("broadcasts.detail.recipients", {
                  count: message.recipients.length,
                })}
              </h3>
              {message.recipients.length > 6 && (
                <TextField
                  size="small"
                  fullWidth
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("broadcasts.dialog.searchContacts")}
                  sx={{ mb: 1 }}
                  slotProps={{
                    htmlInput: {
                      "aria-label": t("broadcasts.dialog.searchContacts"),
                    },
                    input: {
                      startAdornment: (
                        <SearchIcon fontSize="small" color="disabled" />
                      ),
                      endAdornment: query && (
                        <IconButton
                          size="small"
                          aria-label={t("common.clearSearch")}
                          onClick={() => setQuery("")}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                    },
                  }}
                />
              )}
              <ul className="max-h-60 divide-y divide-line overflow-y-auto overscroll-contain rounded-xl border border-line-strong">
                {recipients.length === 0 ? (
                  <li className="p-4 text-sm text-muted">
                    {t("broadcasts.dialog.noResults")}
                  </li>
                ) : (
                  recipients.map((recipient) => (
                    <li
                      key={recipient.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {recipient.name}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-2 text-xs text-muted">
                        <Flag country={phoneCountry(recipient.phone)} />
                        {displayPhone(recipient.phone)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose}>{t("common.close")}</Button>
        {message && (
          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={() => {
              onClose();
              onEdit(message);
            }}
          >
            {t("common.edit")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
