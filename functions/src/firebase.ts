import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Evita inicializar duas vezes (acontece com recarga a quente no emulador e
// nos testes, que importam o código compilado mais de uma vez).
if (getApps().length === 0) initializeApp();

export const db = getFirestore();

export const collections = {
  connections: db.collection("connections"),
  contacts: db.collection("contacts"),
  messages: db.collection("messages"),
  notifications: db.collection("notifications"),
} as const;
