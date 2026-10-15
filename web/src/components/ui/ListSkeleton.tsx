import { Skeleton } from "@mui/material";
import { useT } from "../../i18n/I18nProvider";

/** Linhas de carregamento (efeito shimmer) no lugar de listas e tabelas. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  const t = useT();
  return (
    <div
      className="divide-y divide-line"
      role="status"
      aria-label={t("common.loading")}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="animate-row flex items-center gap-4 p-5"
          style={{ ["--i" as string]: index }}
        >
          <Skeleton variant="rounded" width={44} height={44} animation="wave" />
          <div className="flex-1">
            <Skeleton width="55%" height={22} animation="wave" />
            <Skeleton width="80%" height={16} animation="wave" />
          </div>
          <Skeleton variant="rounded" width={72} height={26} animation="wave" />
        </div>
      ))}
    </div>
  );
}

/** Cards de carregamento para a grade de conexões. */
export function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  const t = useT();
  return (
    <div
      className="grid gap-3 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label={t("common.loading")}
    >
      {Array.from({ length: cards }, (_, index) => (
        <div
          key={index}
          className="animate-item rounded-xl border border-line p-5"
          style={{ ["--i" as string]: index }}
        >
          <Skeleton variant="rounded" width={44} height={44} animation="wave" />
          <Skeleton width="60%" height={28} sx={{ mt: 2 }} animation="wave" />
          <Skeleton width="40%" height={16} animation="wave" />
          <Skeleton
            variant="rounded"
            width="100%"
            height={32}
            sx={{ mt: 2 }}
            animation="wave"
          />
        </div>
      ))}
    </div>
  );
}
