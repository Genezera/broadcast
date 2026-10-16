import type { Timestamp } from "firebase/firestore";

/**
 * Modelo das coleções planas do Firestore. O `id` é o ID do documento e é
 * injetado na leitura; os relacionamentos são feitos por IDs.
 */
export type ConnectionStatus = "active" | "deleting";
// "failed": o agendador desistiu de enviar depois de várias tentativas.
export type MessageStatus = "scheduled" | "sent" | "failed";
export type SendMode = "now" | "scheduled";

export type Connection = {
  id: string;
  tenantId: string;
  name: string;
  status: ConnectionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Contact = {
  id: string;
  tenantId: string;
  connectionId: string;
  name: string;
  phone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** Snapshot do contato no momento do envio. */
export type Recipient = { id: string; name: string; phone: string };

export type Message = {
  id: string;
  tenantId: string;
  connectionId: string;
  body: string;
  contactIds: string[];
  recipients: Recipient[];
  status: MessageStatus;
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** Perfil do cliente em /tenants/{uid}. `photoData` é um data URL pequeno (JPEG). */
export type TenantProfile = {
  email: string;
  name?: string;
  photoData?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * Aviso de "mensagem enviada". Criado só pelas Cloud Functions (o ID é o da
 * mensagem); o cliente lê, marca como lido e apaga.
 */
export type AppNotification = {
  id: string;
  tenantId: string;
  type: "message_sent";
  messageId: string;
  connectionId: string;
  connectionName: string;
  recipientCount: number;
  /** `true` quando a mensagem estava agendada e foi enviada pelo agendador. */
  scheduled: boolean;
  /** Começo do texto, ainda com os marcadores de formatação. */
  bodyPreview: string;
  read: boolean;
  createdAt: Timestamp;
};
