import { deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";

// O cliente só mexe em `read` (marcar como lida) e apaga; criar é do backend.
const ref = (id: string) => doc(db, "notifications", id);

export const markAsRead = (id: string) => updateDoc(ref(id), { read: true });

export const markAllAsRead = (ids: string[]) => {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.update(ref(id), { read: true }));
  return batch.commit();
};

export const removeNotification = (id: string) => deleteDoc(ref(id));

export const removeAll = (ids: string[]) => {
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(ref(id)));
  return batch.commit();
};
