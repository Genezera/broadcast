import { CircularProgress } from "@mui/material";
import { useT } from "../../i18n/I18nProvider";

/** Spinner discreto, com fade de entrada, para áreas que carregam. */
export function Loading() {
  const t = useT();
  return (
    <div
      className="animate-fade flex items-center justify-center py-16"
      role="status"
      aria-label={t("common.loading")}
    >
      <CircularProgress size={30} />
    </div>
  );
}
