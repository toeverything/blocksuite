import { expect } from '@playwright/test';

import {
  assertDatabaseColumnOrder,
  doColumnAction,
  enterPlaygroundRoom,
  focusDatabaseSearch,
  focusDatabaseTitle,
  focusRichText,
  getDatabaseMouse,
  initDatabaseColumn,
  initDatabaseDynamicRowWithData,
  initDatabaseRow,
  initDatabaseRowWithData,
  initEmptyDatabaseState,
  pressArrowLeft,
  pressBackspace,
  pressEnter,
  pressShiftEnter,
  redoByClick,
  redoByKeyboard,
  type,
  undoByClick,
  undoByKeyboard,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertBlockCount,
  assertBlockProps,
  assertDatabaseCellRichTexts,
  assertDatabaseTitleText,
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

// TODO: fix this test when change column type ready
test.skip('database rich text column', async ({ page }) => {
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

  await initDatabaseColumn(page, '1');

  // first added column
  const columnTitle = page.locator('.affine-database-column').nth(1);
  expect(await columnTitle.innerText()).toBe('1');

  await undoByClick(page);
  expect(await columnTitle.innerText()).toBe('Column n');
});

test.skip('should modify the value when the input loses focus', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '1', true);

  // click outside
  await page.mouse.click(200, 200);

  const numberCell = page.locator('affine-database-number-cell > span');
  expect(await numberCell.innerText()).toBe('1');
});

test.skip('should rich-text column support soft enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '123', true);

  const cellSelector = '[data-row-id="4"][data-column-id="3"]';
  await pressArrowLeft(page);
  await pressEnter(page);
  await assertDatabaseCellRichTexts(page, cellSelector, '123');

  await pressShiftEnter(page);
  await assertDatabaseCellRichTexts(page, cellSelector, '12\n3');
});

test.skip('should the single-select mode work correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  // single select mode
  await initDatabaseColumn(page);
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
  const selectOptionNew = page.locator(
    '.select-option-container .select-option-new'
  );
  await selectOptionNew.click();
  expect(await selectCell.innerText()).toBe('2');

  await cell.click();
  expect(await selectOption.count()).toBe(2);
  expect(await selectOption.nth(1).innerText()).toBe('2');
});

test('should the multi-select mode work correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  // multi select mode
  await initDatabaseColumn(page);
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

test('should hide placeholder of paragraph in database', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseRow(page);

  await focusRichText(page);
  const tipsPlaceholder = page.locator('.tips-placeholder');
  expect(await tipsPlaceholder.count()).toEqual(0);
});

test('should show or hide database toolbar', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  const db = await getDatabaseMouse(page);
  await db.mouseOver();
  const toolbar = page.locator('.affine-database-toolbar');
  await expect(toolbar).toBeVisible();
  await db.mouseLeave();
  await expect(toolbar).toBeHidden();

  await db.mouseOver();
  const searchIcon = await focusDatabaseSearch(page);
  await db.mouseLeave();
  await expect(toolbar).toBeVisible();

  // click outside
  const pageTitle = page.locator('.affine-default-page-block-title');
  await pageTitle.click();
  await expect(toolbar).toBeHidden();

  await db.mouseOver();
  await searchIcon.click();
  await type(page, '1');
  await pageTitle.click();
  await expect(toolbar).toBeVisible();
});

test.skip('should database search work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseRowWithData(page, 'text1');
  await initDatabaseDynamicRowWithData(page, '123', false);
  await initDatabaseRowWithData(page, 'text2');
  await initDatabaseDynamicRowWithData(page, '', false);
  await initDatabaseRowWithData(page, 'text3');
  await initDatabaseDynamicRowWithData(page, '26', false);

  // search for '2'
  const searchIcon = await focusDatabaseSearch(page);
  await type(page, '2');
  const rows = page.locator('.affine-database-block-row');
  expect(await rows.count()).toBe(3);

  // search for '23'
  await type(page, '3');
  expect(await rows.count()).toBe(1);
  const cell = page.locator('affine-database-number-cell > span');
  expect(await cell.innerText()).toBe('123');

  // clear search input
  const closeIcon = page.locator('.close-icon');
  await closeIcon.click();
  expect(searchIcon).toBeVisible();
  expect(await rows.count()).toBe(3);
});

test.skip('should database title and rich-text support undo/redo', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '123', true);

  await undoByKeyboard(page);
  const cellSelector = '[data-row-id="4"][data-column-id="3"]';
  await assertDatabaseCellRichTexts(page, cellSelector, '');
  await redoByKeyboard(page);
  await assertDatabaseCellRichTexts(page, cellSelector, '123');

  await focusDatabaseTitle(page);
  await type(page, 'abc');
  await assertDatabaseTitleText(page, 'Database 1abc');
  await undoByKeyboard(page);
  await assertDatabaseTitleText(page, 'Database 1');
  await redoByKeyboard(page);
  await assertDatabaseTitleText(page, 'Database 1abc');
});

test('should support rename column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page, 'abc');

  const columnTitle = page.locator('[data-column-id="3"]');
  const title = columnTitle.locator('.affine-database-column-text-input');
  expect(await title.innerText()).toBe('abc');

  await doColumnAction(page, '3', 'rename');
  await type(page, '123');
  await pressEnter(page);
  expect(await title.innerText()).toBe('123');

  await undoByClick(page);
  expect(await title.innerText()).toBe('abc');
  await redoByClick(page);
  expect(await title.innerText()).toBe('123');
});

test('should support add new column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);

  await initDatabaseDynamicRowWithData(page, '123', true);
  const multiSelect = page.locator('affine-database-multi-select-cell');
  expect(multiSelect).toBeVisible();
  const selected = multiSelect.locator('.select-selected');
  expect(await selected.innerText()).toBe('123');
});

test('should support right insert column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);

  await doColumnAction(page, '3', 'insert-right');
  const columns = page.locator('.affine-database-column');
  expect(await columns.count()).toBe(3);

  await assertDatabaseColumnOrder(page, ['3', '4']);
});

test('should support left insert column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);

  await doColumnAction(page, '3', 'insert-left');
  const columns = page.locator('.affine-database-column');
  expect(await columns.count()).toBe(3);

  await assertDatabaseColumnOrder(page, ['4', '3']);
});

test('should support delete column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);

  const columns = page.locator('.affine-database-column');
  expect(await columns.count()).toBe(2);

  await doColumnAction(page, '3', 'delete');
  expect(await columns.count()).toBe(1);
});

test('should support duplicate column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '123', true);

  await doColumnAction(page, '3', 'duplicate');
  const cells = page.locator('.affine-database-select-cell-container');
  expect(await cells.count()).toBe(2);

  const secondCell = cells.nth(1);
  const selected = secondCell.locator('.select-selected');
  expect(await selected.innerText()).toBe('123');
});

test('should support move column right', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '123', true);
  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, 'abc', false, 1);
  await assertDatabaseColumnOrder(page, ['3', '5']);

  await doColumnAction(page, '3', 'move-right');
  await assertDatabaseColumnOrder(page, ['5', '3']);
});

test('should support move column left', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '123', true);
  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, 'abc', false, 1);
  await assertDatabaseColumnOrder(page, ['3', '5']);

  const titleRow = page.locator('.affine-database-column-header');
  const columnTitle = titleRow.locator('[data-column-id="3"]');
  await columnTitle.click();
  const moveLeft = page.locator('.move-left');
  expect(await moveLeft.count()).toBe(0);

  await doColumnAction(page, '5', 'move-left');
  await assertDatabaseColumnOrder(page, ['5', '3']);
});
