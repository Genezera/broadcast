import { en } from "./en";
import { pt, type Dictionary } from "./pt";

export type Lang = "pt" | "en";
export const LANGS: Lang[] = ["pt", "en"];
export const DEFAULT_LANG: Lang = "pt";

/** Locale usado pelo Intl (datas, nomes de países, plurais). */
export const LOCALES: Record<Lang, string> = { pt: "pt-BR", en: "en-US" };

/** Caminhos de todas as strings do dicionário, ex.: "auth.signIn.title". */
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

type Key = Leaves<Dictionary>;
/** Chaves de plural são usadas sem o sufixo: "contacts.count" -> _one/_other. */
type PluralBase<K extends string> = K extends `${infer B}_one` ? B : never;
export type TKey =
  Exclude<Key, `${string}_one` | `${string}_other`> | PluralBase<Key>;

export type Params = Record<string, string | number>;

export type Translator = {
  (key: TKey, params?: Params): string;
  lang: Lang;
  /** Como `t`, mas devolve `undefined` se a chave não existir (chaves dinâmicas). */
  maybe: (key: string, params?: Params) => string | undefined;
};

const flatten = (source: object, prefix = ""): Record<string, string> =>
  Object.entries(source).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string"
      ? { ...acc, [path]: value }
      : { ...acc, ...flatten(value as object, path) };
  }, {});

export const FLAT_DICTIONARIES: Record<Lang, Record<string, string>> = {
  pt: flatten(pt),
  en: flatten(en),
};

const interpolate = (text: string, params?: Params): string =>
  text.replace(/\{(\w+)\}/g, (_, name: string) =>
    params && name in params ? String(params[name]) : `{${name}}`,
  );

/** Cria o tradutor de um idioma (função pura, fácil de testar). */
export const createTranslator = (lang: Lang): Translator => {
  const table = FLAT_DICTIONARIES[lang];
  const plurals = new Intl.PluralRules(LOCALES[lang]);

  const maybe = (key: string, params?: Params): string | undefined => {
    let text = table[key];
    // Com `count`, procura a variante de plural (_one / _other).
    if (params && typeof params.count === "number") {
      text = table[`${key}_${plurals.select(params.count)}`] ?? text;
    }
    return text === undefined ? undefined : interpolate(text, params);
  };

  const translate = ((key: TKey, params?: Params) =>
    maybe(key, params) ?? key) as Translator;
  translate.lang = lang;
  translate.maybe = maybe;
  return translate;
};

export const translators: Record<Lang, Translator> = {
  pt: createTranslator("pt"),
  en: createTranslator("en"),
};
