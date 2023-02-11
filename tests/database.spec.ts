import { expect } from '@playwright/test';

import {
  enterPlaygroundRoom,
  initEmptyDatabaseState,
  undoByClick,
} from './utils/actions/index.js';
import { assertBlockCount, assertBlockProps } from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('edit database block title and create new rows', async ({ page }) => {
  await enterPlaygroundRoom(page);
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
  const button = page.locator('.affine-database-block-add-row[role="button"]');
  await button.click();
  await button.click();
  await assertBlockProps(page, '3', {
    flavour: 'affine:paragraph',
  });
  await assertBlockProps(page, '4', {
    flavour: 'affine:paragraph',
  });
  await undoByClick(page);
  await undoByClick(page);
  await assertBlockCount(page, 'paragraph', 0);
});
