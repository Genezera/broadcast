import { CircularProgress } from "@mui/material";

/** Spinner discreto, com fade de entrada, para áreas que carregam. */
export function Loading() {
  return (
    <div
      className="animate-fade flex items-center justify-center py-16"
      role="status"
      aria-label="Carregando"
    >
      <CircularProgress size={30} />
    </div>
  );
}
