import { httpsCallable } from "firebase/functions";
import { functions } from "../../../lib/firebase";
import { localInputToIso } from "../../../lib/dates";
import type { MessageFormValues } from "../schemas";

// O cliente não escreve em `messages` (as rules bloqueiam). Tudo passa pelas
// Cloud Functions, que validam destinatários e horário no servidor.
const callable = <Input, Output = unknown>(name: string) =>
  httpsCallable<Input, Output>(functions, name);

type MessagePayload = {
  contactIds: string[];
  body: string;
  mode: MessageFormValues["mode"];
  /** ISO 8601 em UTC, ou `null` para envio imediato. */
  scheduledAt: string | null;
};

// O input datetime-local não tem fuso: "2026-10-15T18:00" é a hora local do
// navegador. Converto para ISO em UTC para o servidor guardar o instante exato.
const toPayload = (values: MessageFormValues): MessagePayload => ({
  contactIds: values.contactIds,
  body: values.body.trim(),
  mode: values.mode,
  scheduledAt:
    values.mode === "scheduled" ? localInputToIso(values.scheduledAt) : null,
});

export const createMessage = (
  connectionId: string,
  values: MessageFormValues,
) =>
  callable<MessagePayload & { connectionId: string }>("createMessage")({
    ...toPayload(values),
    connectionId,
  });

export const updateMessage = (messageId: string, values: MessageFormValues) =>
  callable<MessagePayload & { messageId: string }>("updateMessage")({
    ...toPayload(values),
    messageId,
  });

export const deleteMessage = (messageId: string) =>
  callable<{ messageId: string }>("deleteMessage")({ messageId });
