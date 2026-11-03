import type { FirebaseOptions } from "firebase/app";

// These are public web app identifiers. Admin credentials never belong here.
// Emulator tests always use a demo namespace, even with a real project configured.
export function resolveFirebaseConfiguration(
  env: Record<string, unknown>,
  publicOptions: FirebaseOptions,
) {
  const emulator = env.VITE_USE_EMULATORS === "true";
  if (emulator) {
    return {
      emulator,
      configured: true,
      options: {
        apiKey: "demo-key",
        authDomain: "demo-sneaky-queries.firebaseapp.com",
        databaseURL: "https://demo-sneaky-queries-default-rtdb.firebaseio.com",
        projectId: "demo-sneaky-queries",
        appId: "demo-app",
      } satisfies FirebaseOptions,
    };
  }
  const value = (key: string, fallback?: string) => {
    const override = env[key];
    return (
      (typeof override === "string" && override.trim()) || fallback?.trim()
    );
  };
  const options: FirebaseOptions = {
    ...publicOptions,
    apiKey: value("VITE_FIREBASE_API_KEY", publicOptions.apiKey),
    authDomain: value("VITE_FIREBASE_AUTH_DOMAIN", publicOptions.authDomain),
    databaseURL: value("VITE_FIREBASE_DATABASE_URL", publicOptions.databaseURL),
    projectId: value("VITE_FIREBASE_PROJECT_ID", publicOptions.projectId),
    appId: value("VITE_FIREBASE_APP_ID", publicOptions.appId),
  };
  const configured = Boolean(
    options.apiKey &&
    options.authDomain &&
    options.databaseURL &&
    options.projectId &&
    options.appId,
  );
  return { emulator, configured, options };
}
