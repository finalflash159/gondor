import { defineConfig, devices } from '@playwright/test';
import { E2E_BASE_URL } from './e2e/test-config';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: 'list',
  globalSetup: './e2e/global-setup',
  use: {
    baseURL: E2E_BASE_URL,
    headless: true,
  },
  webServer: {
    command: 'npm run dev:test',
    url: E2E_BASE_URL,
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
