import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";

/** Permite acesso apenas a usuários autenticados. */
export function ProtectedRoute() {
  const { user, ready } = useAuth();
  // Espero o Firebase restaurar a sessão antes de decidir; senão quem já
  // está logado seria jogado para /login a cada refresh.
  if (!ready) return null;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/** Rotas públicas (login/cadastro) redirecionam quem já tem sessão. */
export function PublicOnlyRoute() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}
