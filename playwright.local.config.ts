import { defineConfig } from "@playwright/test";
import shared from "./playwright.config";
// Pass & Play needs no Firebase emulator, login, or running backend.
export default defineConfig({
  ...shared,
  testMatch: "**/passplay.spec.ts",
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
    env: { VITE_USE_EMULATORS: "false" },
  },
});
