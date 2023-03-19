import { expect } from '@playwright/test';

import {
  enterPlaygroundRoom,
  initDatabaseColumn,
  initDatabaseRow,
  initEmptyDatabaseState,
  pressBackspace,
  pressEnter,
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

test('should the single-select mode work correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  // single select mode
  await initDatabaseColumn(page, 'select');
  await initDatabaseRow(page);

  const cell = page.locator('[data-row-id="4"][data-column-id="3"]');
  await cell.click();
  await cell.click();
  await type(page, '1');
  await pressEnter(page);

  const selectCell = page.locator('affine-database-select-cell span');
  expect(await selectCell.innerText()).toBe('1');

  await cell.click();
  const selectOption = page.locator('.select-option-container .select-option');
  expect(await selectOption.count()).toBe(1);
  expect(await selectOption.innerText()).toBe('1');

  const selectInput = page.locator('.select-input');
  await selectInput.click();
  await type(page, '2');
  await pressEnter(page);
  expect(await selectCell.innerText()).toBe('2');

  await cell.click();
  expect(await selectOption.count()).toBe(2);
  expect(await selectOption.nth(1).innerText()).toBe('2');
});

test('should the multi-select mode work correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  // multi select mode
  await initDatabaseColumn(page, 'multi-select');
  await initDatabaseRow(page);

  const cell = page.locator('[data-row-id="4"][data-column-id="3"]');
  await cell.click();
  await cell.click();
  await type(page, '1');
  await pressEnter(page);

  await cell.click();
  const selectInput = page.locator('.select-input');
  await selectInput.click();
  await type(page, '2');
  await pressEnter(page);

  const selectCell = page.locator('affine-database-select-cell span');
  expect(await selectCell.count()).toBe(2);
  expect(await selectCell.nth(0).innerText()).toBe('1');
  expect(await selectCell.nth(1).innerText()).toBe('2');
});
