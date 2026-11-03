import { defineConfig } from "@playwright/test";
import local from "./playwright.config";
// Explicit opt-in: creates a real, expiring party and real anonymous accounts.
// No emulator or local preview server is launched by this configuration.
export default defineConfig({
  ...local,
  webServer: undefined,
  grep: /three independent phones|Pass & Play|choosing one phone/,
  timeout: 90000,
  expect: { timeout: 15000 },
  use: {
    ...local.use,
    baseURL:
      process.env.SQ_LIVE_URL ||
      "https://h4sw5q2wr9-byte.github.io/sneaky-queries/",
    proxy: process.env.HTTPS_PROXY
      ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" }
      : undefined,
  },
});
