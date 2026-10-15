import { updateProfile, type User } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const tenantRef = (uid: string) => doc(db, "tenants", uid);

/** Atualiza o nome no Auth e no perfil (de onde a interface lê em tempo real). */
export const updateProfileName = async (user: User, name: string) => {
  const cleanName = name.trim();
  await updateProfile(user, { displayName: cleanName });
  await updateDoc(tenantRef(user.uid), {
    name: cleanName,
    updatedAt: serverTimestamp(),
  });
};

/** `null` remove a foto. As Security Rules limitam tipo e tamanho do conteúdo. */
export const updateProfilePhoto = (uid: string, photoData: string | null) =>
  updateDoc(tenantRef(uid), { photoData, updatedAt: serverTimestamp() });
