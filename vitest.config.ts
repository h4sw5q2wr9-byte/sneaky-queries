import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: [
      "tests/game.test.ts",
      "tests/config.test.ts",
      "tests/local.test.ts",
      "tests/firebase-lazy.test.ts",
    ],
  },
});
