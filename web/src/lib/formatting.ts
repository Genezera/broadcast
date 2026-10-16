/**
 * Formatação de texto das mensagens, no estilo dos aplicativos de conversa:
 *
 *   *negrito*   _itálico_   __sublinhado__   ~riscado~
 *
 * O texto é guardado com os marcadores e nunca vira HTML: quem exibe monta
 * elementos React a partir desta árvore (ver components/ui/FormattedText).
 */
export type Marker = "*" | "_" | "__" | "~";

export type FormatNode = string | { marker: Marker; children: FormatNode[] };

// "__" vem antes de "_" para o sublinhado não ser lido como dois itálicos.
const MARKERS: Marker[] = ["__", "*", "_", "~"];

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

export type Selection = { value: string; start: number; end: number };

/**
 * Liga ou desliga um estilo na seleção do campo de texto. Com a seleção já
 * marcada, tira os marcadores; sem seleção, abre um par de marcadores com o
 * cursor no meio. Espaços nas pontas ficam fora, porque o marcador precisa
 * encostar no texto para valer.
 */
export const toggleFormat = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  marker: Marker,
): Selection => {
  let start = selectionStart;
  let end = selectionEnd;
  while (start < end && /\s/.test(value[start])) start++;
  while (end > start && /\s/.test(value[end - 1])) end--;
  const size = marker.length;

  // Marcadores logo ao redor da seleção: remove.
  if (
    start >= size &&
    value.slice(start - size, start) === marker &&
    value.slice(end, end + size) === marker
  ) {
    return {
      value:
        value.slice(0, start - size) +
        value.slice(start, end) +
        value.slice(end + size),
      start: start - size,
      end: end - size,
    };
  }
  // A própria seleção já inclui os marcadores: remove.
  if (
    end - start >= size * 2 &&
    value.slice(start, start + size) === marker &&
    value.slice(end - size, end) === marker
  ) {
    return {
      value:
        value.slice(0, start) +
        value.slice(start + size, end - size) +
        value.slice(end),
      start,
      end: end - size * 2,
    };
  }
  return {
    value:
      value.slice(0, start) +
      marker +
      value.slice(start, end) +
      marker +
      value.slice(end),
    start: start + size,
    end: end + size,
  };
};
