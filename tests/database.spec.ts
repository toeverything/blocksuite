import { expect, test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  initEmptyDatabaseState,
  undoByClick,
} from './utils/actions/index.js';
import { assertBlockProps } from './utils/asserts.js';

test('edit database block title', async ({ page }) => {
  await enterPlaygroundRoom(page, {
    enable_database: true,
  });
  await initEmptyDatabaseState(page);

  const locator = page.locator('affine-database');
  await expect(locator).toBeVisible();
  await assertBlockProps(page, '2', {
    title: 'Database 1',
  });
  const databaseTitle = page.locator('.affine-database-block-title');
  await databaseTitle.clear();
  const expected = 'hello';
  await databaseTitle.type(expected);
  await assertBlockProps(page, '2', {
    title: 'hello',
  });
  await undoByClick(page);
  await assertBlockProps(page, '2', {
    title: 'Database 1',
  });
});
