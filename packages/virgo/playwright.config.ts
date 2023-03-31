import type {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from '@playwright/test';
import * as process from 'process';

const config: PlaywrightTestConfig = {
  fullyParallel: true,
  testDir: 'src/',
  testIgnore: ['**.unit.spec.ts'],
  webServer: {
    command: 'pnpm -w dev',
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
    viewport: { width: 900, height: 600 },
    actionTimeout: 1000,
  },
  forbidOnly: !!process.env.CI,
  workers: 4,
  retries: 1,
  // 'github' for GitHub Actions CI to generate annotations, plus a concise 'dot'
  // default 'list' when running locally
  // See https://playwright.dev/docs/test-reporters#github-actions-annotations
  reporter: process.env.CI ? 'github' : 'list',
};

if (process.env.CI) {
  config.retries = 3;
  config.workers = '50%';
}

export default config;
