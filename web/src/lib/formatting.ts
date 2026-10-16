/**
 * Formatação de texto das mensagens. O texto é guardado com marcadores, no
 * estilo dos aplicativos de conversa:
 *
 *   *negrito*   _itálico_   ++sublinhado++   ~riscado~
 *
 * O editor mostra o estilo ao vivo (nada de digitar marcador) e converte de e
 * para esses marcadores. O texto nunca vira HTML: quem exibe monta elementos
 * React a partir desta árvore (ver components/ui/FormattedText).
 */
export type Marker = "*" | "_" | "++" | "~";

export type FormatNode = string | { marker: Marker; children: FormatNode[] };

// "++" vem antes dos demais só para o sublinhado nunca ser lido como outro marcador.
const MARKERS: Marker[] = ["++", "*", "_", "~"];

const isWordChar = (char: string | undefined) =>
  !!char && /[\p{L}\p{N}]/u.test(char);
const isBlank = (char: string | undefined) => !char || /\s/.test(char);

/**
 * Posição do marcador que fecha o trecho aberto antes de `from`. O fechamento
 * não pode vir depois de um espaço nem colado em uma palavra (assim
 * "snake_case_nome" não vira itálico) e o trecho não atravessa linhas.
 */
const findClosing = (text: string, marker: Marker, from: number): number => {
  for (let index = from; index < text.length; index++) {
    if (text[index] === "\n") return -1;
    if (
      index > from &&
      text.startsWith(marker, index) &&
      !isBlank(text[index - 1]) &&
      !isWordChar(text[index + marker.length])
    ) {
      return index;
    }
  }
  return -1;
};

export const parseFormatting = (text: string): FormatNode[] => {
  const nodes: FormatNode[] = [];
  let plain = "";
  let index = 0;

  const flush = () => {
    if (plain) nodes.push(plain);
    plain = "";
  };

  while (index < text.length) {
    const marker = MARKERS.find((item) => text.startsWith(item, index));
    // Abre só no começo de uma palavra e colado no texto: "2 * 3" não vira negrito.
    if (
      marker &&
      !isWordChar(text[index - 1]) &&
      !isBlank(text[index + marker.length])
    ) {
      const start = index + marker.length;
      const close = findClosing(text, marker, start);
      if (close > start) {
        flush();
        nodes.push({
          marker,
          children: parseFormatting(text.slice(start, close)),
        });
        index = close + marker.length;
        continue;
      }
    }
    plain += text[index];
    index++;
  }
  flush();
  return nodes;
};

const plainOf = (nodes: FormatNode[]): string =>
  nodes
    .map((node) => (typeof node === "string" ? node : plainOf(node.children)))
    .join("");

/** O texto sem os marcadores (usado em prévias curtas, como as notificações). */
export const stripFormatting = (text: string): string =>
  plainOf(parseFormatting(text));

export const hasFormatting = (text: string): boolean =>
  parseFormatting(text).some((node) => typeof node !== "string");

// --- Ponte com o editor (documento do ProseMirror/Tiptap) -------------------

/** Parte do documento do editor que usamos: parágrafos com texto e estilos. */
export type DocNode = {
  type: string;
  text?: string;
  marks?: { type: string }[];
  content?: DocNode[];
};

const MARK_OF: Record<Marker, string> = {
  "*": "bold",
  _: "italic",
  "++": "underline",
  "~": "strike",
};

// Ordem fixa dos marcadores de fora para dentro, para o resultado ser estável.
const MARK_ORDER = ["underline", "bold", "italic", "strike"] as const;
const MARKER_OF: Record<string, Marker> = {
  underline: "++",
  bold: "*",
  italic: "_",
  strike: "~",
};

const lineToNodes = (nodes: FormatNode[], marks: string[]): DocNode[] =>
  nodes.flatMap((node): DocNode[] =>
    typeof node === "string"
      ? [
          {
            type: "text",
            text: node,
            ...(marks.length > 0 && {
              marks: marks.map((type) => ({ type })),
            }),
          },
        ]
      : lineToNodes(node.children, [...marks, MARK_OF[node.marker]]),
  );

/** Texto com marcadores -> documento do editor (um parágrafo por linha). */
export const markersToDoc = (text: string): DocNode => ({
  type: "doc",
  content: text.split("\n").map((line): DocNode => {
    const content = lineToNodes(parseFormatting(line), []);
    return content.length > 0
      ? { type: "paragraph", content }
      : { type: "paragraph" };
  }),
});

const textToMarkers = (node: DocNode): string => {
  const text = node.text ?? "";
  const active = new Set((node.marks ?? []).map((mark) => mark.type));
  const ordered = MARK_ORDER.filter((type) => active.has(type));
  const core = text.trim();
  if (ordered.length === 0 || core === "") return text;
  // O marcador precisa encostar no texto: espaços das pontas ficam de fora.
  const lead = text.slice(0, text.indexOf(core));
  const trail = text.slice(lead.length + core.length);
  const open = ordered.map((type) => MARKER_OF[type]);
  return lead + open.join("") + core + [...open].reverse().join("") + trail;
};

/** Documento do editor -> texto com marcadores (um parágrafo por linha). */
export const docToMarkers = (doc: DocNode): string =>
  (doc.content ?? [])
    .map((paragraph) =>
      (paragraph.content ?? [])
        .map((node) => (node.type === "hardBreak" ? "\n" : textToMarkers(node)))
        .join(""),
    )
    .join("\n");
