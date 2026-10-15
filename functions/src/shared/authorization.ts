import type { DocumentSnapshot } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

/** O `uid` do Firebase Authentication é o identificador do tenant. */
export const requireTenantId = (uid: string | undefined): string => {
  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "Entre na sua conta para continuar.",
    );
  }
  return uid;
};

// Atenção: o Admin SDK ignora as Security Rules. Toda function precisa
// conferir o dono do documento aqui, senão qualquer usuário logado
// conseguiria mexer em dados de outro cliente passando o ID.
export const belongsToTenant = (
  snapshot: DocumentSnapshot,
  tenantId: string,
): boolean => snapshot.exists && snapshot.get("tenantId") === tenantId;

/**
 * Responde "não encontrado" tanto para documentos inexistentes quanto para
 * documentos de outro tenant, para não revelar a existência de dados alheios.
 */
export const assertBelongsToTenant = (
  snapshot: DocumentSnapshot,
  tenantId: string,
  notFoundMessage: string,
): void => {
  if (!belongsToTenant(snapshot, tenantId)) {
    throw new HttpsError("not-found", notFoundMessage);
  }
};
