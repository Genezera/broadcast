import { useRef, type KeyboardEvent } from "react";
import { IconButton, TextField, Tooltip } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import { FormattedText } from "../../../components/ui/FormattedText";
import { useI18n } from "../../../i18n/I18nProvider";
import {
  hasFormatting,
  toggleFormat,
  type Marker,
} from "../../../lib/formatting";

type MessageEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  maxLength: number;
};

const STYLES = [
  { marker: "*", icon: FormatBoldIcon, key: "bold", shortcut: "B" },
  { marker: "_", icon: FormatItalicIcon, key: "italic", shortcut: "I" },
  { marker: "__", icon: FormatUnderlinedIcon, key: "underline", shortcut: "U" },
  { marker: "~", icon: StrikethroughSIcon, key: "strike", shortcut: "X" },
] as const;

/**
 * Campo da mensagem com barra de formatação (negrito, itálico, sublinhado e
 * riscado). A barra só coloca marcadores no texto (ver lib/formatting) e
 * uma prévia mostra como a mensagem fica depois de formatada.
 */
export function MessageEditor({
  value,
  onChange,
  onBlur,
  error,
  maxLength,
}: MessageEditorProps) {
  const { t } = useI18n();
  const input = useRef<HTMLTextAreaElement>(null);

  const apply = (marker: Marker) => {
    const element = input.current;
    if (!element) return;
    const next = toggleFormat(
      value,
      element.selectionStart,
      element.selectionEnd,
      marker,
    );
    if (next.value.length > maxLength) return;
    onChange(next.value);
    // O React reescreve o texto; só depois disso dá para repor a seleção.
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(next.start, next.end);
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    const style = STYLES.find(
      (item) =>
        item.shortcut.toLowerCase() === key &&
        // Riscado usa Ctrl+Shift+X; os outros, só Ctrl.
        (item.key === "strike") === event.shiftKey,
    );
    if (style) {
      event.preventDefault();
      apply(style.marker);
    }
  };

  return (
    <div>
      <div
        className="mb-1.5 flex items-center gap-0.5"
        role="toolbar"
        aria-label={t("format.toolbar")}
      >
        {STYLES.map(({ marker, icon: Icon, key, shortcut }) => (
          <Tooltip
            key={key}
            title={`${t(`format.${key}`)} (Ctrl+${key === "strike" ? "Shift+" : ""}${shortcut})`}
          >
            <IconButton
              size="small"
              aria-label={t(`format.${key}`)}
              // Mantém a seleção do texto ao clicar na barra.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => apply(marker)}
            >
              <Icon fontSize="small" />
            </IconButton>
          </Tooltip>
        ))}
        <span className="ml-2 hidden text-xs text-muted sm:inline">
          {t("format.hint")}
        </span>
      </div>
      <TextField
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        label={t("broadcasts.dialog.messageLabel")}
        multiline
        minRows={4}
        maxRows={10}
        fullWidth
        error={!!error}
        helperText={
          error ??
          t("broadcasts.dialog.counter", {
            count: value.length,
            max: maxLength,
          })
        }
        inputRef={input}
        slotProps={{ htmlInput: { maxLength } }}
      />
      {hasFormatting(value) && (
        <div className="mt-3 rounded-xl border border-line bg-surface-muted p-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">
            {t("format.preview")}
          </p>
          <div className="max-h-40 overflow-y-auto text-sm">
            <FormattedText text={value} />
          </div>
        </div>
      )}
    </div>
  );
}
