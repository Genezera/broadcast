import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { formatDateTime as formatDate, type TimestampLike } from "../lib/dates";
import {
  DEFAULT_LANG,
  LANGS,
  LOCALES,
  translators,
  type Lang,
  type Translator,
} from "./translate";

const STORAGE_KEY = "broadcast:lang";

type I18nValue = {
  lang: Lang;
  locale: string;
  t: Translator;
  setLanguage: (lang: Lang) => void;
  /** Data e hora curtas no idioma atual. */
  formatDateTime: (value?: TimestampLike | null) => string;
};

const valueFor = (
  lang: Lang,
): Pick<I18nValue, "lang" | "locale" | "t" | "formatDateTime"> => ({
  lang,
  locale: LOCALES[lang],
  t: translators[lang],
  formatDateTime: (value) => formatDate(value, LOCALES[lang]),
});

// Sem provider (testes, componentes isolados) o app funciona em português.
const I18nContext = createContext<I18nValue>({
  ...valueFor(DEFAULT_LANG),
  setLanguage: () => {},
});

/** Escolha salva; sem ela, usa o idioma do navegador (inglês ou português). */
const detectLanguage = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (LANGS as string[]).includes(saved)) return saved as Lang;
  } catch {
    // Armazenamento indisponível: segue o navegador.
  }
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "pt";
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const LANG_ANIMATION_MS = 520;

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectLanguage);

  // <html lang>, título e descrição acompanham o idioma (acessibilidade e SEO).
  useLayoutEffect(() => {
    const t = translators[lang];
    document.documentElement.lang = LOCALES[lang];
    document.title = t("meta.title");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t("meta.description"));
  }, [lang]);

  const setLanguage = useCallback(
    (next: Lang) => {
      if (next === lang) return;
      const commit = () => {
        flushSync(() => setLang(next));
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Sem persistência: a escolha vale só nesta sessão.
        }
      };

      if (prefersReducedMotion()) {
        commit();
        return;
      }

      const root = document.documentElement;
      if (document.startViewTransition) {
        // O CSS usa data-vt="lang" para trocar o efeito (ver styles.css):
        // a tela antiga some desfocando e a nova entra subindo.
        root.dataset.vt = "lang";
        const transition = document.startViewTransition(commit);
        transition.finished.finally(() => delete root.dataset.vt);
        return;
      }

      // Sem View Transitions: troca o texto e faz o conteúdo "reaparecer".
      commit();
      document.getElementById("root")?.animate(
        [
          { opacity: 0, transform: "translateY(10px)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: LANG_ANIMATION_MS,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    },
    [lang],
  );

  const value = useMemo(
    () => ({ ...valueFor(lang), setLanguage }),
    [lang, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = (): I18nValue => useContext(I18nContext);

/** Atalho para quem só precisa traduzir textos. */
export const useT = (): Translator => useContext(I18nContext).t;
