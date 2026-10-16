import type { ReactNode } from "react";
import {
  parseFormatting,
  type FormatNode,
  type Marker,
} from "../../lib/formatting";

const TAGS: Record<Marker, "strong" | "em" | "u" | "s"> = {
  "*": "strong",
  _: "em",
  "++": "u",
  "~": "s",
};

const render = (nodes: FormatNode[]): ReactNode[] =>
  nodes.map((node, index) => {
    if (typeof node === "string") return node;
    const Tag = TAGS[node.marker];
    return <Tag key={index}>{render(node.children)}</Tag>;
  });

/**
 * Mostra o texto de uma mensagem com negrito, itálico, sublinhado e riscado.
 * Monta só elementos React (nada de HTML do usuário), então é seguro.
 */
export function FormattedText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <p className={`whitespace-pre-wrap break-words ${className}`}>
      {render(parseFormatting(text))}
    </p>
  );
}
