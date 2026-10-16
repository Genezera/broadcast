import type { Timestamp } from "firebase-admin/firestore";

// "failed": o agendador desistiu depois de várias tentativas (ver processScheduled).
export type MessageStatus = "scheduled" | "sent" | "failed";
// "deleting" é um estado transitório: bloqueia novas escritas enquanto a
// exclusão em cascata está em andamento.
export type ConnectionStatus = "active" | "deleting";

/** Snapshot do contato no momento do envio; mantém o histórico legível. */
export type Recipient = { id: string; name: string; phone: string };

export type MessageDocument = {
  tenantId: string;
  connectionId: string;
  body: string;
  contactIds: string[];
  recipients: Recipient[];
  status: MessageStatus;
  /** Tentativas de envio que falharam; só existe em mensagens agendadas. */
  attempts?: number;
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
