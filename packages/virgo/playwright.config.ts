import type {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'src/',
  testIgnore: ['**.unit.spec.ts'],
  workers: 1,
  webServer: {
    command: 'pnpm dev',
    port: 5173,
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
};

export default config;
