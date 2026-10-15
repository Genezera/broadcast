import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/**
 * Anima um número do valor atual até `target` (ease-out cúbico). Devolve
 * `null` enquanto o valor ainda não existe. Sem animação para quem pediu
 * movimento reduzido no sistema.
 */
export function useCountUp(
  target: number | null,
  duration = 800,
): number | null {
  const [value, setValue] = useState(0);
  // Guardo o último valor exibido para a próxima animação partir dele.
  const current = useRef(0);

  useEffect(() => {
    if (target === null) return;
    if (prefersReducedMotion()) {
      current.current = target;
      setValue(target);
      return;
    }
    const from = current.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current.current = Math.round(from + (target - from) * eased);
      setValue(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return target === null ? null : value;
}
