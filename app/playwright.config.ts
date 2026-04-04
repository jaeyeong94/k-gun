import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "pnpm dev -p 3334",
    port: 3334,
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://localhost:3334",
  },
});
