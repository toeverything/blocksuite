import type {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'src/',
  testIgnore: ['**.unit.spec.ts'],
  workers: 1,
  use: {
    browserName:
      (process.env
        .TEST_PLAYWRIGHT_BROWSER_NAME as PlaywrightWorkerOptions['browserName']) ??
      'chromium',
    viewport: { width: 900, height: 600 },
    actionTimeout: 1000,
  },
};

if (process.env.CI) {
  config.webServer = {
    command: 'pnpm dev',
    port: 5173,
  };
}

export default config;
