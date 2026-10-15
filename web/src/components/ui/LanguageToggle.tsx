import { LANGS, type Lang } from "../../i18n/translate";
import { useI18n } from "../../i18n/I18nProvider";

const SHORT: Record<Lang, string> = { pt: "PT", en: "EN" };

/**
 * Seletor de idioma em formato de "pílula": uma marca desliza sob o idioma
 * ativo e o conteúdo da tela troca com uma transição suave (ver I18nProvider).
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLanguage, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("language.group")}
      className={`lang-toggle ${className}`}
      data-lang={lang}
    >
      <span className="lang-thumb" aria-hidden="true" />
      {LANGS.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={item === lang}
          aria-label={t("language.switchTo", {
            language: t(`language.${item}`),
          })}
          className="lang-option"
          onClick={() => setLanguage(item)}
        >
          {SHORT[item]}
        </button>
      ))}
    </div>
  );
}
