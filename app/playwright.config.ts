import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "pnpm dev -p 3333",
    port: 3333,
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://localhost:3333",
  },
});
