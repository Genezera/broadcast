import type { TKey, Translator } from "../i18n/translate";

const AUTH_KEYS: Record<string, TKey> = {
  "auth/email-already-in-use": "errors.auth.emailInUse",
  "auth/invalid-email": "errors.auth.invalidEmail",
  "auth/weak-password": "errors.auth.weakPassword",
  "auth/invalid-credential": "errors.auth.invalidCredential",
  // Versões antigas do Firebase devolvem estes códigos para e-mail ou senha errados.
  "auth/wrong-password": "errors.auth.invalidCredential",
  "auth/user-not-found": "errors.auth.invalidCredential",
  "auth/user-disabled": "errors.auth.userDisabled",
  "auth/requires-recent-login": "errors.auth.requiresRecentLogin",
  "auth/too-many-requests": "errors.auth.tooManyRequests",
  "auth/network-request-failed": "errors.auth.network",
};

const FIREBASE_KEYS: Record<string, TKey> = {
  "permission-denied": "errors.firebase.permissionDenied",
  unauthenticated: "errors.firebase.unauthenticated",
  unavailable: "errors.firebase.unavailable",
  "deadline-exceeded": "errors.firebase.deadlineExceeded",
};

type ErrorLike = {
  code?: string;
  message?: string;
  /** Chave de erro enviada pelas Cloud Functions (ver functions/src/shared/errors.ts). */
  details?: { key?: string; params?: Record<string, string | number> };
};

/**
 * Converte qualquer erro do Firebase em uma mensagem amigável no idioma do
 * usuário. Erros das Cloud Functions trazem uma chave em `details`, traduzida
 * aqui; sem ela, usa o código do erro.
 */
export const getErrorMessage = (error: unknown, t: Translator): string => {
  const { code, message, details } = (error ?? {}) as ErrorLike;
  if (!code) return t("errors.generic");
  if (AUTH_KEYS[code]) return t(AUTH_KEYS[code]);

  if (details?.key) {
    const text = t.maybe(`errors.server.${details.key}`, details.params);
    if (text) return text;
  }

  const shortCode = code.replace(/^(functions|firestore)\//, "");
  if (FIREBASE_KEYS[shortCode]) return t(FIREBASE_KEYS[shortCode]);
  // Códigos de validação já vêm com um texto pronto da function.
  if (
    ["invalid-argument", "not-found", "failed-precondition"].includes(
      shortCode,
    ) &&
    message
  ) {
    return message;
  }
  return t("errors.generic");
};
