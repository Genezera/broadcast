import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email.trim(), password);

export const signOutUser = () => signOut(auth);

// O Firebase não informa se o e-mail existe (proteção contra enumeração de contas),
// então a tela mostra sempre a mesma mensagem.
export const requestPasswordReset = (email: string) =>
  sendPasswordResetEmail(auth, email.trim());

/**
 * Garante o documento `/tenants/{uid}` do cliente. Contas criadas antes do
 * perfil existir também são cobertas, por isso a checagem acontece no login.
 */
export const ensureTenantProfile = async (user: User): Promise<void> => {
  const reference = doc(db, "tenants", user.uid);
  if ((await getDoc(reference)).exists()) return;
  await setDoc(reference, {
    email: user.email ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
