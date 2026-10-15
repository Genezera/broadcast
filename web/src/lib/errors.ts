const FALLBACK = "Não foi possível concluir a operação. Tente novamente.";

const AUTH_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Este e-mail já está cadastrado.",
  "auth/invalid-email": "Digite um e-mail válido.",
  "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/requires-recent-login":
    "Por segurança, saia e entre novamente para fazer esta alteração.",
  "auth/too-many-requests":
    "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
  "auth/network-request-failed": "Sem conexão com a internet.",
};

const FIREBASE_MESSAGES: Record<string, string> = {
  "permission-denied": "Você não tem permissão para realizar esta ação.",
  unauthenticated: "Sua sessão expirou. Entre novamente.",
  unavailable: "Serviço indisponível no momento. Tente novamente.",
  "deadline-exceeded": "A operação demorou demais. Tente novamente.",
};

/** Callables retornam mensagens já prontas para o usuário nestes códigos. */
const CALLABLE_CODES = [
  "invalid-argument",
  "not-found",
  "failed-precondition",
];

/** Converte qualquer erro do Firebase em uma mensagem amigável em português. */
export const getErrorMessage = (error: unknown): string => {
  const { code, message } = (error ?? {}) as {
    code?: string;
    message?: string;
  };
  if (!code) return FALLBACK;
  if (AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];

  const shortCode = code.replace(/^(functions|firestore)\//, "");
  if (FIREBASE_MESSAGES[shortCode]) return FIREBASE_MESSAGES[shortCode];
  if (CALLABLE_CODES.includes(shortCode) && message) return message;
  return FALLBACK;
};
