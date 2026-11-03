import { initializeApp } from "firebase/app";
import {
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
  signInAnonymously,
} from "firebase/auth";
import { connectDatabaseEmulator, getDatabase } from "firebase/database";
import type { Auth } from "firebase/auth";
import type { Database } from "firebase/database";
import publicOptions from "../data/firebase.web.json";
import { resolveFirebaseConfiguration } from "./config";
const configuration = resolveFirebaseConfiguration(
  import.meta.env,
  publicOptions,
);
export const { emulator, configured } = configuration;
const app = initializeApp(configuration.options);
// The app may be used entirely on one phone. Do not initialize Auth/Database
// until an online operation is requested (including on iPhone Safari).
let services: { auth: Auth; db: Database } | null = null;
function onlineServices() {
  if (!configured) throw new Error("configuration");
  if (!services) {
    const auth = getAuth(app);
    if (emulator)
      connectAuthEmulator(auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
    const db = getDatabase(app);
    if (emulator) connectDatabaseEmulator(db, "127.0.0.1", 9000);
    services = { auth, db };
  }
  return services;
}
export const database = () => onlineServices().db;
let signingIn: Promise<string> | null = null;
export function identity(): Promise<string> {
  if (!configured) return Promise.reject(new Error("configuration"));
  if (!signingIn)
    signingIn = (async () => {
      const { auth } = onlineServices();
      await setPersistence(auth, browserSessionPersistence);
      await auth.authStateReady();
      return auth.currentUser?.uid || (await signInAnonymously(auth)).user.uid;
    })().catch((error) => {
      signingIn = null;
      throw error;
    });
  return signingIn;
}
