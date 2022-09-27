import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'tests',
  fullyParallel: true,
  use: {
    browserName: 'chromium',
    viewport: { width: 900, height: 600 },
  },
};

if (process.env.CI) {
  config.webServer = {
    command: 'pnpm dev',
    port: 5173,
  };
  // config.workers = 2;
}

export default config;
