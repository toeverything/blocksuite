import type {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from '@playwright/test';

import * as process from 'node:process';

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  // See https://playwright.dev/docs/test-reporters#github-actions-annotations
  reporter: process.env.CI ? 'github' : 'list',
  retries: 1,
  testDir: 'src/',
  testIgnore: ['**.unit.spec.ts'],
  use: {
    actionTimeout: 1000,
    browserName:
      (process.env.BROWSER as PlaywrightWorkerOptions['browserName']) ??
      'chromium',
    viewport: { height: 900, width: 900 },
  },
  webServer: {
    command: 'pnpm -w dev',
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
  workers: 4,
};

if (process.env.CI) {
  config.retries = 3;
  config.workers = '50%';
}

export default config;
