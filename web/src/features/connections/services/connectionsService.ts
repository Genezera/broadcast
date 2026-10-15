import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../../lib/firebase";

// Criar e renomear vão direto no Firestore: as Security Rules já validam o
// dono, o nome e os campos permitidos, então não preciso de uma function.
export const createConnection = (tenantId: string, name: string) =>
  addDoc(collection(db, "connections"), {
    tenantId,
    name: name.trim(),
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const renameConnection = (connectionId: string, name: string) =>
  updateDoc(doc(db, "connections", connectionId), {
    name: name.trim(),
    updatedAt: serverTimestamp(),
  });

// Excluir é diferente: precisa apagar contatos e mensagens junto, de forma
// controlada, e isso só o backend (Admin SDK) faz com segurança.
export const deleteConnection = (connectionId: string) =>
  httpsCallable(functions, "deleteConnection")({ connectionId });
