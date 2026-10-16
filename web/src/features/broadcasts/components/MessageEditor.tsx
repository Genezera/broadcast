import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold } from "@tiptap/extension-bold";
import { Italic } from "@tiptap/extension-italic";
import { Strike } from "@tiptap/extension-strike";
import { Underline } from "@tiptap/extension-underline";
import { FormHelperText, IconButton, Tooltip } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import StrikethroughSIcon from "@mui/icons-material/StrikethroughS";
import { useI18n } from "../../../i18n/I18nProvider";
import {
  docToMarkers,
  markersToDoc,
  type DocNode,
} from "../../../lib/formatting";

type MessageEditorProps = {
  /** Texto guardado, com os marcadores de formatação. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  maxLength: number;
};

// O texto é guardado com marcadores (*negrito*, _itálico_...), então desligo
// os atalhos de digitação do editor ("**x**" virando negrito, por exemplo):
// quem formata usa a barra ou os atalhos de teclado, e o que está na tela é
// sempre o texto já formatado.

const noTypingRules = {
  addInputRules: () => [],
  addPasteRules: () => [],
};

const extensions = [
  // Só parágrafos e quebras de linha: nada de títulos, listas, código etc.
  StarterKit.configure({
    bold: false,
    italic: false,
    strike: false,
    underline: false,
    heading: false,
    blockquote: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    listKeymap: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: false,
  }),
  Bold.extend(noTypingRules),
  Italic.extend(noTypingRules),
  Underline,
  Strike.extend({
    ...noTypingRules,
    addKeyboardShortcuts() {
      return {
        "Mod-Shift-x": () => this.editor.commands.toggleStrike(),
      };
    },
  }),
];

const STYLES = [
  { key: "bold", icon: FormatBoldIcon, shortcut: "Ctrl+B" },
  { key: "italic", icon: FormatItalicIcon, shortcut: "Ctrl+I" },
  { key: "underline", icon: FormatUnderlinedIcon, shortcut: "Ctrl+U" },
  { key: "strike", icon: StrikethroughSIcon, shortcut: "Ctrl+Shift+X" },
] as const;

/**
 * Campo da mensagem com formatação ao vivo: selecione o texto e use a barra
 * (ou Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Shift+X) e o estilo aparece ali mesmo.
 * Por baixo, o valor continua sendo o texto com marcadores (ver lib/formatting).
 */
export function MessageEditor({
  value,
  onChange,
  onBlur,
  error,
  maxLength,
}: MessageEditorProps) {
  const { t } = useI18n();

  const editor = useEditor({
    extensions,
    content: markersToDoc(value),
    // Para os botões refletirem o estilo do trecho onde está o cursor.
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": t("broadcasts.dialog.messageLabel"),
        class: "message-editor-content",
      },
      // Para de aceitar texto ao chegar no limite de caracteres.
      handleTextInput: (view) =>
        docToMarkers(view.state.doc.toJSON() as DocNode).length >= maxLength,
    },
    onUpdate: ({ editor: current }) =>
      onChange(docToMarkers(current.getJSON() as DocNode)),
    onBlur: () => onBlur?.(),
  });

  // O formulário pode trocar o valor por fora (abrir outra mensagem, limpar):
  // só reescrevo o editor quando o texto realmente difere do que ele mostra.
  useEffect(() => {
    if (!editor) return;
    if (docToMarkers(editor.getJSON() as DocNode) !== value) {
      editor.commands.setContent(markersToDoc(value), { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div>
      <p className="mb-1 text-sm font-bold">
        {t("broadcasts.dialog.messageLabel")}
      </p>
      <div
        className={`message-editor ${error ? "message-editor-error" : ""}`}
        onClick={() => editor?.chain().focus().run()}
      >
        <div
          className="flex items-center gap-0.5 border-b border-line px-2 py-1"
          role="toolbar"
          aria-label={t("format.toolbar")}
        >
          {STYLES.map(({ key, icon: Icon, shortcut }) => {
            const active = !!editor?.isActive(key);
            return (
              <Tooltip key={key} title={`${t(`format.${key}`)} (${shortcut})`}>
                <IconButton
                  size="small"
                  aria-label={t(`format.${key}`)}
                  aria-pressed={active}
                  color={active ? "primary" : "default"}
                  className={active ? "bg-brand-soft" : ""}
                  disabled={!editor}
                  // Mantém a seleção do texto ao clicar na barra.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.stopPropagation();
                    const chain = editor?.chain().focus();
                    if (key === "bold") chain?.toggleBold().run();
                    else if (key === "italic") chain?.toggleItalic().run();
                    else if (key === "underline")
                      chain?.toggleUnderline().run();
                    else chain?.toggleStrike().run();
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              </Tooltip>
            );
          })}
        </div>
        <div className="relative">
          {editor?.isEmpty && (
            <span className="pointer-events-none absolute left-3.5 top-3 text-muted">
              {t("broadcasts.dialog.messagePlaceholder")}
            </span>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
      <FormHelperText error={!!error} sx={{ mx: 0 }}>
        {error ??
          t("broadcasts.dialog.counter", {
            count: value.length,
            max: maxLength,
          })}
      </FormHelperText>
    </div>
  );
}
