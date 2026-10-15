import {
  HttpsError,
  type FunctionsErrorCode,
} from "firebase-functions/v2/https";

/**
 * Erros devolvidos ao cliente. Cada um leva uma `key` estável em `details`:
 * o app usa a chave para mostrar o texto no idioma escolhido pelo usuário.
 * A `message` em português fica como padrão para quem consome a API direto.
 */
const MESSAGES = {
  authRequired: "Entre na sua conta para continuar.",
  invalidData: "Dados inválidos.",
  invalidId: "Identificador inválido.",
  bodyRequired: "A mensagem é obrigatória.",
  bodyEmpty: "A mensagem não pode ficar vazia.",
  bodyTooLong: "A mensagem deve ter no máximo {max} caracteres.",
  noRecipients: "Selecione pelo menos um contato.",
  tooManyRecipients: "Selecione no máximo {max} contatos.",
  duplicateRecipients: "Contatos duplicados.",
  invalidSchedule: "Agendamento inválido.",
  scheduleOutOfRange: "Escolha um horário futuro dentro de um ano.",
  connectionNotFound: "Conexão não encontrada.",
  messageNotFound: "Mensagem não encontrada.",
  recipientNotInConnection: "Um dos contatos não pertence a esta conexão.",
  sentCannotReschedule: "Uma mensagem enviada não pode voltar a ser agendada.",
} as const;

export type ErrorKey = keyof typeof MESSAGES;
export const isErrorKey = (value: string): value is ErrorKey =>
  value in MESSAGES;

type Params = Record<string, string | number>;

const format = (text: string, params?: Params): string =>
  text.replace(/\{(\w+)\}/g, (_, name: string) =>
    params && name in params ? String(params[name]) : `{${name}}`,
  );

export const fail = (
  code: FunctionsErrorCode,
  key: ErrorKey,
  params?: Params,
): HttpsError =>
  new HttpsError(code, format(MESSAGES[key], params), { key, params });
