export type TimestampLike = { toDate: () => Date };

// Um formatador por idioma (criar Intl.DateTimeFormat é relativamente caro).
const formatters = new Map<string, Intl.DateTimeFormat>();
const formatterFor = (locale: string) => {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    });
    formatters.set(locale, formatter);
  }
  return formatter;
};

export const formatDateTime = (
  value?: TimestampLike | null,
  locale = "pt-BR",
): string => (value ? formatterFor(locale).format(value.toDate()) : "—");

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
