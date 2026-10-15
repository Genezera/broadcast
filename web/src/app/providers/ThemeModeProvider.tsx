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
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme, type ThemeMode } from "../theme";

const STORAGE_KEY = "broadcast:theme";
const REVEAL_MS = 750;

type Origin = { x: number; y: number };
type ThemeModeContextValue = {
  mode: ThemeMode;
  /** `origin` é o ponto (em px) de onde a animação de troca se expande. */
  toggle: (origin?: Origin) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Escolha salva; sem ela, segue o tema do sistema operacional. */
const initialMode = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Armazenamento indisponível (modo privado): sigo o sistema.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyToDocument = (mode: ThemeMode) => {
  document.documentElement.dataset.theme = mode;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", mode === "dark" ? "#0d0e1a" : "#f7f8fb");
};

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Mantém o <html> sincronizado (o script do index.html já definiu o valor
  // inicial antes da primeira pintura, para a página não piscar).
  useLayoutEffect(() => applyToDocument(mode), [mode]);

  const toggle = useCallback(
    (origin?: Origin) => {
      const next: ThemeMode = mode === "dark" ? "light" : "dark";
      const commit = () => {
        // Atributo e estado do React mudam juntos, dentro do mesmo "quadro".
        applyToDocument(next);
        flushSync(() => setMode(next));
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Sem persistência: a escolha vale só nesta sessão.
        }
      };

      const root = document.documentElement;
      if (prefersReducedMotion()) {
        commit();
        return;
      }

      // Sem View Transitions (ex.: Firefox antigo): transição suave de cores.
      if (!document.startViewTransition) {
        root.classList.add("theme-switching");
        commit();
        setTimeout(() => root.classList.remove("theme-switching"), 600);
        return;
      }

      // Revelação circular: a tela nova "cresce" a partir do botão clicado.
      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? 0;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      const transition = document.startViewTransition(commit);
      transition.ready
        .then(() =>
          root.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: REVEAL_MS,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          ),
        )
        .catch(() => {
          // Transição cancelada (aba em segundo plano): o tema já foi aplicado.
        });
    },
    [mode],
  );

  const value = useMemo(() => ({ mode, toggle }), [mode, toggle]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode deve ser usado dentro de ThemeModeProvider.");
  }
  return context;
}
