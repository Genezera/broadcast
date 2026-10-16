import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { collections } from "../firebase";

type SentNotificationInput = {
  tenantId: string;
  messageId: string;
  connectionId: string;
  connectionName: string;
  recipientCount: number;
  body: string;
  /** `true` quando a mensagem estava agendada e foi enviada pelo agendador. */
  scheduled: boolean;
};

/** Trecho do texto mostrado na notificação (o app remove a formatação). */
const PREVIEW_LENGTH = 80;

/**
 * Registra o aviso "mensagem enviada". O ID é o da própria mensagem, então
 * cada mensagem gera no máximo uma notificação, mesmo se a escrita se repetir.
 * Só as functions criam notificações; o cliente apenas lê e marca como lida.
 */
export const writeSentNotification = (
  transaction: Transaction,
  input: SentNotificationInput,
): void => {
  transaction.set(collections.notifications.doc(input.messageId), {
    tenantId: input.tenantId,
    type: "message_sent",
    messageId: input.messageId,
    connectionId: input.connectionId,
    connectionName: input.connectionName,
    recipientCount: input.recipientCount,
    scheduled: input.scheduled,
    bodyPreview: input.body.slice(0, PREVIEW_LENGTH),
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
};
