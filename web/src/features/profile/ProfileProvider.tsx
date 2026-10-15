import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { TenantProfile } from "../../types";

type ProfileState = {
  profile: TenantProfile | null;
  loading: boolean;
};

const ProfileContext = createContext<ProfileState | null>(null);

/**
 * Perfil do cliente (`/tenants/{uid}`) em tempo real. Uma única assinatura
 * alimenta o avatar do cabeçalho, o menu e a página Minha conta, então uma
 * mudança de nome ou foto aparece em todos os lugares ao mesmo tempo.
 */
export function ProfileProvider({
  tenantId,
  children,
}: {
  tenantId: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: true,
  });

  useEffect(
    () =>
      onSnapshot(
        doc(db, "tenants", tenantId),
        (snapshot) =>
          setState({
            profile: snapshot.exists()
              ? (snapshot.data() as TenantProfile)
              : null,
            loading: false,
          }),
        // Sem perfil legível a interface cai no nome do Auth / e-mail.
        () => setState({ profile: null, loading: false }),
      ),
    [tenantId],
  );

  return (
    <ProfileContext.Provider value={state}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileState {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile deve ser usado dentro de ProfileProvider.");
  }
  return context;
}
