import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

// Enquanto o cadastro está em andamento, quem cria o perfil é o próprio
// signUp (ele já sabe o nome). Sem isso, o listener de login criaria um
// perfil vazio antes, na frente do signUp.
let signUpInProgress = false;

const tenantRef = (uid: string) => doc(db, "tenants", uid);

const createTenantProfile = (user: User, name: string) =>
  setDoc(tenantRef(user.uid), {
    email: user.email ?? "",
    ...(name ? { name } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const signUp = async (email: string, password: string, name: string) => {
  signUpInProgress = true;
  try {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    const cleanName = name.trim();
    // O nome fica no Auth (útil em qualquer tela) e no perfil do Firestore
    // (de onde a interface lê, em tempo real).
    await updateProfile(user, { displayName: cleanName });
    await createTenantProfile(user, cleanName);
    return user;
  } finally {
    signUpInProgress = false;
  }
};

export const signOutUser = () => signOut(auth);

// O Firebase não informa se o e-mail existe (proteção contra enumeração de contas),
// então a tela mostra sempre a mesma mensagem.
export const requestPasswordReset = (email: string) =>
  sendPasswordResetEmail(auth, email.trim());

/**
 * Troca a senha de quem já está logado. O Firebase exige uma autenticação
 * recente para operações sensíveis, então confirmo a senha atual primeiro.
 */
export const changePassword = async (
  user: User,
  currentPassword: string,
  newPassword: string,
) => {
  const credential = EmailAuthProvider.credential(
    user.email ?? "",
    currentPassword,
  );
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

/**
 * Garante o documento `/tenants/{uid}` do cliente. Contas criadas antes do
 * perfil existir também são cobertas, por isso a checagem acontece no login.
 */
export const ensureTenantProfile = async (user: User): Promise<void> => {
  if (signUpInProgress) return;
  if ((await getDoc(tenantRef(user.uid))).exists()) return;
  await createTenantProfile(user, user.displayName ?? "");
};
