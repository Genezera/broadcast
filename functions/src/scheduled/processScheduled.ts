import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { DocumentReference } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { LIMITS, REGION } from "../config";
import { collections, db } from "../firebase";

/**
 * Marca a mensagem como enviada se, no momento da transação, ela ainda estiver
 * agendada e vencida. Revalidar dentro da transação garante idempotência e
 * evita corridas com reagendamentos, exclusões e execuções sobrepostas.
 */
export const sendIfDue = (ref: DocumentReference): Promise<boolean> =>
  db.runTransaction(async (transaction) => {
    // A consulta da varredura pode estar defasada (a mensagem pode ter sido
    // editada, reagendada ou apagada nesse intervalo), então confiro de novo.
    const current = await transaction.get(ref);
    const scheduledAt = current.get("scheduledAt") as Timestamp | null;
    if (
      !current.exists ||
      current.get("status") !== "scheduled" ||
      !scheduledAt ||
      scheduledAt.toMillis() > Date.now()
    ) {
      return false;
    }
    transaction.update(ref, {
      status: "sent",
      sentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });

/** Processa mensagens vencidas em páginas. Retorna quantas foram enviadas. */
export const processDueMessages = async (): Promise<number> => {
  let sent = 0;
  for (let page = 0; page < LIMITS.schedulerMaxPages; page++) {
    // Precisa do índice composto status + scheduledAt (firestore.indexes.json).
    const due = await collections.messages
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", Timestamp.now())
      .orderBy("scheduledAt")
      .limit(LIMITS.schedulerPageSize)
      .get();
    if (due.empty) break;

    // allSettled: se uma mensagem falhar, as outras da página continuam.
    const results = await Promise.allSettled(
      due.docs.map(async (doc) => {
        const transitioned = await sendIfDue(doc.ref);
        if (transitioned) {
          logger.info("scheduled_message_sent", {
            messageId: doc.id,
            tenantId: doc.get("tenantId"),
            scheduledAt: (doc.get("scheduledAt") as Timestamp)
              .toDate()
              .toISOString(),
            processedAt: new Date().toISOString(),
          });
        }
        return transitioned;
      }),
    );

    let sentInPage = 0;
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        if (result.value) sentInPage++;
      } else {
        logger.error("scheduled_message_failed", {
          messageId: due.docs[index].id,
          error: result.reason,
        });
      }
    });
    sent += sentInPage;
    // Sem progresso: evita reler indefinidamente as mesmas mensagens com falha.
    if (sentInPage === 0) break;
  }
  return sent;
};

/** Executa a cada minuto via Cloud Scheduler, sem depender de sessão aberta. */
export const processScheduledMessages = onSchedule(
  { schedule: "every 1 minutes", region: REGION, maxInstances: 1 },
  async () => {
    const sent = await processDueMessages();
    logger.info("scheduled_run_finished", { sent });
  },
);
