import { useCountUp } from "../../hooks/useCountUp";

/** Número que "conta" até o valor final; mostra um traço enquanto carrega. */
export function AnimatedNumber({ value }: { value: number | null }) {
  const animated = useCountUp(value);
  return <>{animated ?? "–"}</>;
}
