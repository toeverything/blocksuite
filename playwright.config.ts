/// <reference types="node" />
import type { PlaywrightWorkerOptions } from '@playwright/test';

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 40000,
  fullyParallel: true,
  snapshotDir: 'tests/snapshots',
  snapshotPathTemplate: 'tests/snapshots/{testFilePath}/{arg}{ext}',
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    // command: process.env.CI ? 'pnpm preview' : 'pnpm dev',
    // port: process.env.CI ? 4173 : 5173,
    reuseExistingServer: !process.env.CI,
    env: {
      COVERAGE: process.env.COVERAGE ?? '',
    },
  },
  use: {
    browserName:
      (process.env.BROWSER as PlaywrightWorkerOptions['browserName']) ??
      'chromium',
    viewport: { width: 960, height: 900 },
    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    // You can open traces locally(`npx playwright show-trace trace.zip`)
    // or in your browser on [Playwright Trace Viewer](https://trace.playwright.dev/).
    trace: 'on-first-retry',
    // Record video only when retrying a test for the first time.
    video: 'on-first-retry',
    // Timeout for each action
    actionTimeout: 5_000,
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  workers: '80%',
  retries: process.env.CI ? 3 : 0,
  // 'github' for GitHub Actions CI to generate annotations, plus a concise 'dot'
  // default 'list' when running locally
  // See https://playwright.dev/docs/test-reporters#github-actions-annotations
  reporter: process.env.CI ? 'github' : 'list',
});
