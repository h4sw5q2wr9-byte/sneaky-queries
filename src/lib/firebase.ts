import { initializeApp } from "firebase/app";
import {
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
  signInAnonymously,
} from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import publicOptions from "../data/firebase.web.json";
import { resolveFirebaseConfiguration } from "./config";
const configuration = resolveFirebaseConfiguration(
  import.meta.env,
  publicOptions,
);
export const { emulator, configured } = configuration;
const app = initializeApp(configuration.options);
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
