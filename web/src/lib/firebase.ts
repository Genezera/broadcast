import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const env = import.meta.env;

const requiredVariables = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

// Falhar cedo com uma mensagem clara é melhor que um erro obscuro do Firebase
// depois, quando alguém esquece de criar o .env.local.
const missing = requiredVariables.filter((name) => !env[name]);
if (missing.length > 0) {
  throw new Error(
    `Variáveis de ambiente ausentes: ${missing.join(", ")}. ` +
      "Copie web/.env.example para web/.env.local e preencha os valores.",
  );
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
});

export const auth = getAuth(app);
export const db = getFirestore(app);
/** A região precisa coincidir com a das Cloud Functions (`functions/src/config.ts`). */
export const functions = getFunctions(
  app,
  env.VITE_FUNCTIONS_REGION || "southamerica-east1",
);

// Só liga os emuladores em desenvolvimento, para nunca vazar para o build de produção.
if (env.DEV && env.VITE_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
