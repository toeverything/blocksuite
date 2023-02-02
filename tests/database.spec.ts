import { expect, test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  initEmptyDatabaseState,
} from './utils/actions/index.js';

test('init database block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  const locator = page.locator('affine-database');
  await expect(locator).toBeVisible();
});
