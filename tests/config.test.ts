import { describe, expect, it } from "vitest";
import { resolveFirebaseConfiguration } from "../src/lib/config";
const stored = {
  apiKey: "public-key",
  authDomain: "party.firebaseapp.com",
  databaseURL: "https://party-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "party",
  appId: "public-app",
};
describe("public Firebase configuration and emulator isolation", () => {
  it("uses the repository web configuration without requiring account secret management", () => {
    const config = resolveFirebaseConfiguration({}, stored);
    expect(config.configured).toBe(true);
    expect(config.emulator).toBe(false);
    expect(config.options).toEqual(stored);
  });
  it("treats empty Actions variables as absent", () => {
    expect(
      resolveFirebaseConfiguration(
        { VITE_FIREBASE_API_KEY: "", VITE_FIREBASE_DATABASE_URL: "  " },
        stored,
      ).options,
    ).toEqual(stored);
  });
  it("allows another deployment to override all project identifiers", () => {
    const config = resolveFirebaseConfiguration(
      {
        VITE_FIREBASE_API_KEY: " other-key ",
        VITE_FIREBASE_AUTH_DOMAIN: "other.firebaseapp.com",
        VITE_FIREBASE_DATABASE_URL: "https://other.firebaseio.com",
        VITE_FIREBASE_PROJECT_ID: "other",
        VITE_FIREBASE_APP_ID: "other-app",
      },
      stored,
    );
    expect(config.options).toEqual({
      apiKey: "other-key",
      authDomain: "other.firebaseapp.com",
      databaseURL: "https://other.firebaseio.com",
      projectId: "other",
      appId: "other-app",
    });
  });
  it("detects incomplete configuration", () => {
    expect(resolveFirebaseConfiguration({}, {}).configured).toBe(false);
    expect(
      resolveFirebaseConfiguration({}, { ...stored, appId: "" }).configured,
    ).toBe(false);
  });
  it("forces emulator mode to a demo project regardless of public or environment values", () => {
    const config = resolveFirebaseConfiguration(
      { VITE_USE_EMULATORS: "true", VITE_FIREBASE_PROJECT_ID: "real-project" },
      stored,
    );
    expect(config.configured).toBe(true);
    expect(config.emulator).toBe(true);
    expect(config.options.projectId).toBe("demo-sneaky-queries");
    expect(config.options.databaseURL).toContain("demo-sneaky-queries");
    expect(config.options.apiKey).toBe("demo-key");
  });
});
