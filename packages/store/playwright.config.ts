import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'src/blob/__tests__',
  fullyParallel: true,
  use: {
    browserName: 'chromium',
    viewport: { width: 900, height: 600 },
    actionTimeout: 1000,
  },
};

export default config;
