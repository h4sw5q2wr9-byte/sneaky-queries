import { beforeEach, describe, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({
  app: { name: "test-app" },
  auth: {
    currentUser: { uid: "existing-player" },
    authStateReady: vi.fn(async () => {}),
  },
  db: {},
  initializeApp: vi.fn(),
  getAuth: vi.fn(),
  getDatabase: vi.fn(),
  setPersistence: vi.fn(async () => {}),
  signInAnonymously: vi.fn(),
  connectAuthEmulator: vi.fn(),
  connectDatabaseEmulator: vi.fn(),
}));
vi.mock("firebase/app", () => ({ initializeApp: sdk.initializeApp }));
vi.mock("firebase/auth", () => ({
  browserSessionPersistence: "session",
  getAuth: sdk.getAuth,
  setPersistence: sdk.setPersistence,
  signInAnonymously: sdk.signInAnonymously,
  connectAuthEmulator: sdk.connectAuthEmulator,
}));
vi.mock("firebase/database", () => ({
  getDatabase: sdk.getDatabase,
  connectDatabaseEmulator: sdk.connectDatabaseEmulator,
}));
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  sdk.initializeApp.mockReturnValue(sdk.app);
  sdk.getAuth.mockReturnValue(sdk.auth);
  sdk.getDatabase.mockReturnValue(sdk.db);
});
describe("Firebase stays inactive until online play", () => {
  it("does not initialize Auth or Database when importing the app configuration", async () => {
    const firebase = await import("../src/lib/firebase");
    expect(firebase.configured).toBe(true);
    expect(sdk.initializeApp).toHaveBeenCalledOnce();
    expect(sdk.getAuth).not.toHaveBeenCalled();
    expect(sdk.getDatabase).not.toHaveBeenCalled();
  });
  it("initializes services once when an online identity is requested", async () => {
    const firebase = await import("../src/lib/firebase");
    expect(await firebase.identity()).toBe("existing-player");
    expect(await firebase.identity()).toBe("existing-player");
    expect(firebase.database()).toBe(sdk.db);
    expect(sdk.getAuth).toHaveBeenCalledOnce();
    expect(sdk.getDatabase).toHaveBeenCalledOnce();
    expect(sdk.setPersistence).toHaveBeenCalledOnce();
  });
});
