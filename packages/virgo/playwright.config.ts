import type {
  PlaywrightTestConfig,
  PlaywrightWorkerOptions,
} from '@playwright/test';
import * as process from 'process';

const config: PlaywrightTestConfig = {
  testDir: 'src/',
  testIgnore: ['**.unit.spec.ts'],
  forbidOnly: !!process.env.CI,
  workers: 4,
  use: {
    browserName:
      (process.env.BROWSER as PlaywrightWorkerOptions['browserName']) ??
      'chromium',
    viewport: { width: 900, height: 600 },
    actionTimeout: 1000,
  },
};

if (process.env.CI) {
  config.webServer = {
    command: 'pnpm -w dev',
    port: 5173,
  };
}

export default config;
