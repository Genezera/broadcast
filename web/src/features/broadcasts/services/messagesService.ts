import { httpsCallable } from "firebase/functions";
import { functions } from "../../../lib/firebase";
import { localInputToIso } from "../../../lib/dates";
import type { MessageFormValues } from "../schemas";

// O cliente não escreve em `messages` (as rules bloqueiam). Tudo passa pelas
// Cloud Functions, que validam destinatários e horário no servidor.
const callable = <Input, Output = unknown>(name: string) =>
  httpsCallable<Input, Output>(functions, name);

type Schedule = {
  mode: MessageFormValues["mode"];
  /** ISO 8601 em UTC, ou `null` para envio imediato. */
  scheduledAt: string | null;
};

export type CreateResult = {
  /** Primeira mensagem criada (uma por conexão no envio em massa). */
  id: string;
  ids: string[];
  connectionCount: number;
  recipientCount: number;
};

// O campo de data local não tem fuso: "2026-10-15T18:00" é a hora do navegador.
// Converto para ISO em UTC para o servidor guardar o instante exato.
const toSchedule = (values: MessageFormValues): Schedule => ({
  mode: values.mode,
  scheduledAt:
    values.mode === "scheduled" ? localInputToIso(values.scheduledAt) : null,
});

export const createMessage = (values: MessageFormValues) => {
  const common = { body: values.body.trim(), ...toSchedule(values) };
  return values.audience === "connections"
    ? callable<unknown, CreateResult>("createMessage")({
        ...common,
        audience: "connections",
        connectionIds: values.connectionIds,
      })
    : callable<unknown, CreateResult>("createMessage")({
        ...common,
        connectionId: values.connectionId,
        contactIds: values.contactIds,
      });
};

export const updateMessage = (messageId: string, values: MessageFormValues) =>
  callable("updateMessage")({
    messageId,
    contactIds: values.contactIds,
    body: values.body.trim(),
    ...toSchedule(values),
  });

export const deleteMessage = (messageId: string) =>
  callable<{ messageId: string }>("deleteMessage")({ messageId });
