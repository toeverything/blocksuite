import { expect } from '@playwright/test';

import {
  enterPlaygroundRoom,
  focusRichText,
  initDatabaseColumn,
  initDatabaseRow,
  initEmptyDatabaseState,
  pressArrowLeft,
  pressBackspace,
  pressEnter,
  pressShiftEnter,
  SHORT_KEY,
  type,
  undoByClick,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertBlockCount,
  assertBlockProps,
  assertDatabaseCellRichTexts,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('edit database block title and create new rows', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  const locator = page.locator('affine-database');
  await expect(locator).toBeVisible();
  const dbTitle = 'Database 1';
  await assertBlockProps(page, '2', {
    title: dbTitle,
  });
  for (let i = 0; i < dbTitle.length; i++) {
    await pressBackspace(page);
  }
  const expected = 'hello';
  await type(page, expected);
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

  const columnAddBtn = page.locator('.affine-database-block-add-column-button');
  await columnAddBtn.click();

  const columnAddPopup = page.locator('affine-database-add-column-type-popup');
  expect(columnAddPopup).toBeVisible();
  const columnType = columnAddPopup.locator('[data-type="number"]');
  await columnType.click();

  // first added column
  const columnTitle = page.locator('.affine-database-block-column').nth(1);
  expect(columnTitle).toBeVisible();
  await columnTitle.click();

  const columnEditPopup = page.locator('affine-database-edit-column-popup');
  expect(columnEditPopup).toBeVisible();
  const input = columnEditPopup.locator('div > input');
  await input.click();
  await page.keyboard.press(`${SHORT_KEY}+a`);
  await type(page, '1');
  const saveBtn = columnEditPopup.locator('div > button');
  await saveBtn.click();
  expect(await columnTitle.innerText()).toBe('1');

  await undoByClick(page);
  expect(await columnTitle.innerText()).toBe('new column');
});

test('should modify the value when the input loses focus', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseRow(page);

  const cell = page.locator('[data-row-id="4"][data-column-id="3"]');
  await cell.click();
  await cell.click();
  await type(page, '1');

  // click outside
  await page.mouse.click(200, 200);

  const numberCell = page.locator('affine-database-number-cell > span');
  expect(await numberCell.innerText()).toBe('1');
});

test('should rich-text column support soft enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page, 'rich-text');
  await initDatabaseRow(page);

  const cellSelector = '[data-row-id="4"][data-column-id="3"]';
  const cell = page.locator(cellSelector);
  await cell.click();
  await cell.click();
  await type(page, '123');

  await pressArrowLeft(page);
  await pressEnter(page);
  await assertDatabaseCellRichTexts(page, cellSelector, '123');

  await pressShiftEnter(page);
  await assertDatabaseCellRichTexts(page, cellSelector, '12\n3');
});

test('should hide placeholder of paragraph in database', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseRow(page);

  await focusRichText(page);
  const tipsPlaceholder = page.locator('.tips-placeholder');
  expect(await tipsPlaceholder.count()).toEqual(0);
});
