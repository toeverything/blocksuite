import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'src/',
  testIgnore: ['**.unit.spec.ts'],
  workers: 1,
  use: {
    browserName: 'chromium',
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
