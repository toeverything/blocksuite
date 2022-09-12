import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'tests',
  fullyParallel: true,
  use: {
    viewport: { width: 500, height: 500 },
  },
  webServer: {
    command: 'pnpm dev',
    port: 5173,
  },
};

export default config;
