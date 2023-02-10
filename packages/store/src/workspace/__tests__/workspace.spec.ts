import { test } from '@playwright/test';

import { collectTestResult } from '../../__tests__/test-utils-node.js';

// checkout test-entry.ts for actual test cases
const workspaceExamplePage = 'http://localhost:5173/examples/workspace/';

test('workspace basics', async ({ page }) => {
  await page.goto(workspaceExamplePage);
  await page.locator('#test-basic').click();
  await collectTestResult(page);
});
