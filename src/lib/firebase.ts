import { initializeApp } from "firebase/app";
import {
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
  signInAnonymously,
} from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
const env = import.meta.env;
export const emulator = env.VITE_USE_EMULATORS === "true";
export const configured =
  emulator ||
  Boolean(
    env.VITE_FIREBASE_API_KEY &&
    env.VITE_FIREBASE_AUTH_DOMAIN &&
    env.VITE_FIREBASE_DATABASE_URL &&
    env.VITE_FIREBASE_PROJECT_ID &&
    env.VITE_FIREBASE_APP_ID,
  );
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain:
    env.VITE_FIREBASE_AUTH_DOMAIN || "demo-sneaky-queries.firebaseapp.com",
  databaseURL:
    env.VITE_FIREBASE_DATABASE_URL ||
    "https://demo-sneaky-queries-default-rtdb.firebaseio.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "demo-sneaky-queries",
  appId: env.VITE_FIREBASE_APP_ID || "demo-app",
});
export const auth = getAuth(app);
export const db = getDatabase(app);
if (emulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectDatabaseEmulator(db, "127.0.0.1", 9000);
}
let signingIn: Promise<string> | null = null;
export function identity(): Promise<string> {
  if (!configured) return Promise.reject(new Error("configuration"));
  if (!signingIn)
    signingIn = (async () => {
      await setPersistence(auth, browserSessionPersistence);
      await auth.authStateReady();
      return auth.currentUser?.uid || (await signInAnonymously(auth)).user.uid;
    })().catch((error) => {
      signingIn = null;
      throw error;
    });
  return signingIn;
}
