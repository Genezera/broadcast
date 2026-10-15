import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useI18n } from "./I18nProvider";

/**
 * As mensagens de erro de um formulário ficam guardadas no estado dele. Ao
 * trocar o idioma, revalido os campos para os erros já exibidos serem
 * recriados no novo idioma (só depois de o formulário ter sido enviado).
 */
export function useRevalidateOnLanguage<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, "trigger" | "formState">,
) {
  const { lang } = useI18n();
  const { trigger, formState } = form;
  const submitted = formState.submitCount > 0;

  useEffect(() => {
    if (submitted) void trigger();
    // Só o idioma dispara a revalidação (trigger muda a cada render).
  }, [lang]);
}
