import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests drive the REAL stack (Next.js -> Spring Boot -> PostgreSQL) — start it first
 * (docker compose up, or the local dev servers) and optionally set E2E_BASE_URL.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
