/// <reference types="node" />
import type { PlaywrightWorkerOptions } from '@playwright/test';

import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  // See https://playwright.dev/docs/test-reporters#github-actions-annotations
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 3 : 0,
  snapshotDir: 'tests/snapshots',
  testDir: 'tests',
  timeout: 40000,
  use: {
    // Timeout for each action
    actionTimeout: 5_000,
    browserName:
      (process.env.BROWSER as PlaywrightWorkerOptions['browserName']) ??
      'chromium',
    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    // You can open traces locally(`npx playwright show-trace trace.zip`)
    permissions: ['clipboard-read', 'clipboard-write'],
    // or in your browser on [Playwright Trace Viewer](https://trace.playwright.dev/).
    trace: 'on-first-retry',
    // Record video only when retrying a test for the first time.
    video: 'on-first-retry',
    viewport: { height: 900, width: 960 },
  },
  webServer: {
    command: 'pnpm dev',
    env: {
      COVERAGE: process.env.COVERAGE ?? '',
    },
    // command: process.env.CI ? 'pnpm preview' : 'pnpm dev',
    port: 5173,
    // port: process.env.CI ? 4173 : 5173,
    reuseExistingServer: !process.env.CI,
  },
  // 'github' for GitHub Actions CI to generate annotations, plus a concise 'dot'
  // default 'list' when running locally
  workers: '80%',
});
