import { expect } from '@playwright/test';

import {
  enterPlaygroundRoom,
  initEmptyDatabaseState,
  SHORT_KEY,
  type,
  undoByClick,
  waitNextFrame,
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

test('database rich text column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);
  const databaseElement = page.locator('affine-database');
  const addRowButton = databaseElement.locator(
    '[data-test-id="affine-database-add-row-button"]'
  );
  const addColumnButton = databaseElement.locator(
    '[data-test-id="affine-database-add-column-button"]'
  );
  await addColumnButton.click();
  await page
    .locator('affine-database-add-column-type-popup')
    .locator('div[data-type="rich-text"]')
    .click();
  await addRowButton.click();
  const richTextCell = page.locator('affine-database-rich-text-cell');
  await richTextCell.click();
  await waitNextFrame(page);
  await richTextCell.type('hello', { delay: 50 });
  const text1 = await page.evaluate(() => {
    return window.page.columns.toJSON()[4][3].value;
  });
  expect(text1).toBe('hello');
  await richTextCell.type(' world', { delay: 50 });
  const text2 = await page.evaluate(() => {
    return window.page.columns.toJSON()[4][3].value;
  });
  expect(() => expect(text2).toBe('hello world'));
});

test('edit column title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  const columnAddBtn = await page.locator(
    '.affine-database-block-add-column-button'
  );
  await columnAddBtn.click();

  const columnAddPopup = await page.locator(
    'affine-database-add-column-type-popup'
  );
  expect(columnAddPopup).toBeVisible();
  const columnType = await columnAddPopup.locator('[data-type="number"]');
  await columnType.click();

  // first added column
  const columnTitle = await page
    .locator('.affine-database-block-column')
    .nth(1);
  expect(columnTitle).toBeVisible();
  await columnTitle.click();

  const columnEditPopup = await page.locator(
    'affine-database-edit-column-popup'
  );
  expect(columnEditPopup).toBeVisible();
  const input = await columnEditPopup.locator('div > input');
  await input.click();
  await page.keyboard.press(`${SHORT_KEY}+a`);
  await type(page, '1');
  const saveBtn = await columnEditPopup.locator('div > button');
  await saveBtn.click();
  expect(await columnTitle.innerText()).toBe('1');

  await undoByClick(page);
  expect(await columnTitle.innerText()).toBe('new column');
});
