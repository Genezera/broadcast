import type { DocumentSnapshot } from "firebase-admin/firestore";
import { fail, type ErrorKey } from "./errors";

/** O `uid` do Firebase Authentication é o identificador do tenant. */
export const requireTenantId = (uid: string | undefined): string => {
  if (!uid) throw fail("unauthenticated", "authRequired");
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
  notFoundKey: Extract<ErrorKey, "connectionNotFound" | "messageNotFound">,
): void => {
  if (!belongsToTenant(snapshot, tenantId)) {
    throw fail("not-found", notFoundKey);
  }
};
