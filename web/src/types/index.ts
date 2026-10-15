import type { Timestamp } from "firebase/firestore";

/**
 * Modelo das coleções planas do Firestore. O `id` é o ID do documento e é
 * injetado na leitura; os relacionamentos são feitos por IDs.
 */
export type ConnectionStatus = "active" | "deleting";
export type MessageStatus = "scheduled" | "sent";
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
