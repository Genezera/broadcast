type TimestampLike = { toDate: () => Date };

const formatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export const formatDateTime = (value?: TimestampLike | null): string =>
  value ? formatter.format(value.toDate()) : "—";

const pad = (value: number) => String(value).padStart(2, "0");

/** Formata uma data local no padrão de `<input type="datetime-local">`. */
export const toLocalInputValue = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
  `T${pad(date.getHours())}:${pad(date.getMinutes())}`;

/**
 * Interpreta o valor de um `datetime-local` no fuso do navegador e o converte
 * para ISO 8601 em UTC, o instante absoluto que o backend armazena.
 */
export const localInputToIso = (value: string): string =>
  new Date(value).toISOString();

export const isFuture = (value: string, now = Date.now()): boolean => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > now;
};
