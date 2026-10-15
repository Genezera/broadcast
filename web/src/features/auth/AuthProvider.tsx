import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { ensureTenantProfile } from "./authService";

type AuthState = {
  user: User | null;
  /** `false` até o Firebase restaurar (ou descartar) a sessão salva. Sem isso a tela de login piscaria para quem já está logado. */
  ready: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

// O Firebase restaura a sessão em poucos ms, e a splash sumiria antes de dar
// para ver. Na abertura do site ela fica pelo menos esse tempo na tela.
const MIN_SPLASH_MS = 1400;

const prefersReducedMotion = () => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, ready: false });

  useEffect(() => {
    const openedAt = performance.now();
    let firstEvent = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Cria o perfil /tenants/{uid} no primeiro acesso. Se falhar não
      // trava o app, o perfil não é necessário para usar as telas.
      if (user) {
        ensureTenantProfile(user).catch((error) =>
          console.error("tenant_profile_failed", error),
        );
      }

      // Só o primeiro evento (abertura do site) espera a splash. Login e
      // logout depois disso atualizam a tela na hora.
      const wait =
        firstEvent && !prefersReducedMotion()
          ? Math.max(0, MIN_SPLASH_MS - (performance.now() - openedAt))
          : 0;
      firstEvent = false;
      clearTimeout(timer);
      timer = setTimeout(() => setState({ user, ready: true }), wait);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}

/** Usuário autenticado; só pode ser chamado em rotas protegidas. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("Nenhum usuário autenticado.");
  return user;
}
