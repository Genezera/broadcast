import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { ContactFormValues } from "../schemas";

type NewContact = ContactFormValues & {
  tenantId: string;
  connectionId: string;
};

// Escrita direta no Firestore. Quem garante que a conexão é do mesmo cliente
// e que o telefone é válido são as Security Rules, não só o formulário.
export const createContact = ({ name, phone, ...owner }: NewContact) =>
  addDoc(collection(db, "contacts"), {
    ...owner,
    name: name.trim(),
    phone: phone.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const updateContact = (
  contactId: string,
  { name, phone }: ContactFormValues,
) =>
  updateDoc(doc(db, "contacts", contactId), {
    name: name.trim(),
    phone: phone.trim(),
    updatedAt: serverTimestamp(),
  });

export const deleteContact = (contactId: string) =>
  deleteDoc(doc(db, "contacts", contactId));
