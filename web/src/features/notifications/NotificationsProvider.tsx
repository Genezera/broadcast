import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useNotify } from "../../app/providers/NotificationProvider";
import { useI18n } from "../../i18n/I18nProvider";
import { db } from "../../lib/firebase";
import type { AppNotification } from "../../types";
import { wasAnnounced } from "./announced";

type NotificationsState = {
  notifications: AppNotification[];
  unread: number;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

/** Quantas notificações ficam na lista do sino. */
const MAX_NOTIFICATIONS = 30;

/** Tempo para a tela que enviou a mensagem anunciar antes da notificação. */
const ANNOUNCE_DELAY_MS = 1500;

/**
 * Assina as notificações do cliente em tempo real. Além de alimentar o sino,
 * mostra um aviso na tela quando uma notificação nova chega com o app aberto
 * (por exemplo, quando o agendador envia uma mensagem agendada). As que já
 * existiam ao abrir o app só entram no sino, sem aviso.
 */
export function NotificationsProvider({
  tenantId,
  children,
}: {
  tenantId: string;
  children: ReactNode;
}) {
  const notify = useNotify();
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // O texto do aviso depende do idioma; guardo em refs para a troca de idioma
  // não refazer a assinatura nem repetir avisos.
  const translate = useRef(t);
  translate.current = t;
  const show = useRef(notify);
  show.current = notify;

  useEffect(() => {
    let firstSnapshot = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const unsubscribe = onSnapshot(
      query(
        collection(db, "notifications"),
        where("tenantId", "==", tenantId),
        orderBy("createdAt", "desc"),
        limit(MAX_NOTIFICATIONS),
      ),
      (snapshot) => {
        setNotifications(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as AppNotification,
          ),
        );
        if (firstSnapshot) {
          firstSnapshot = false;
          return;
        }
        const fresh = snapshot
          .docChanges()
          .filter((change) => change.type === "added")
          .map(
            (change) =>
              ({ id: change.doc.id, ...change.doc.data() }) as AppNotification,
          );
        if (fresh.length === 0) return;

        // Espero um instante antes de avisar: se a tela que enviou a mensagem
        // já anunciou (ver announced.ts), não repito o aviso.
        timers.push(
          setTimeout(() => {
            const pending = fresh.filter((item) => !wasAnnounced(item.id));
            if (pending.length === 0) return;
            const say = translate.current;
            if (pending.length > 1) {
              show.current.success(
                say("notifications.toast.many", { count: pending.length }),
              );
              return;
            }
            const [item] = pending;
            show.current.success(
              say(
                item.scheduled
                  ? "notifications.toast.sentScheduled"
                  : "notifications.toast.sentNow",
                {
                  count: item.recipientCount,
                  connection: item.connectionName || "—",
                },
              ),
            );
          }, ANNOUNCE_DELAY_MS),
        );
      },
      // Sem permissão ou sem índice: o sino fica vazio, o resto do app segue.
      (cause) => console.error("notifications_failed", cause),
    );
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, [tenantId]);

  const value = useMemo(
    () => ({
      notifications,
      unread: notifications.filter((item) => !item.read).length,
    }),
    [notifications],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsState {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications deve ser usado dentro de NotificationsProvider.",
    );
  }
  return context;
}
