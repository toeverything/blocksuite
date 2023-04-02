import { expect } from '@playwright/test';

import {
  assertDatabaseColumnOrder,
  clickDatabaseOutside,
  enterPlaygroundRoom,
  focusDatabaseSearch,
  focusDatabaseTitle,
  focusRichText,
  getDatabaseMouse,
  getFirstColumnCell,
  initDatabaseColumn,
  initDatabaseDynamicRowWithData,
  initDatabaseRow,
  initDatabaseRowWithData,
  initEmptyDatabaseState,
  performColumnAction,
  performSelectColumnTagAction,
  pressArrowLeft,
  pressBackspace,
  pressEnter,
  pressShiftEnter,
  redoByClick,
  redoByKeyboard,
  switchColumnType,
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
  await initDatabaseRowWithData(page, '');
  await initDatabaseRowWithData(page, '');
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

test('should modify the value when the input loses focus', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await switchColumnType(page, 'number');
  await initDatabaseDynamicRowWithData(page, '1', true);

  await clickDatabaseOutside(page);
  const cell = getFirstColumnCell(page, 'number');
  expect(await cell.innerText()).toBe('1');
});

test('should rich-text column support soft enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await switchColumnType(page, 'rich-text');
  await initDatabaseDynamicRowWithData(page, '123', true);

  const cellSelector = '[data-row-id="4"][data-column-id="3"]';
  const cell = getFirstColumnCell(page, 'rich-text-container');
  await cell.click();
  await pressArrowLeft(page);
  await pressEnter(page);
  await assertDatabaseCellRichTexts(page, cellSelector, '123');

  await cell.click();
  await pressArrowLeft(page);
  await pressShiftEnter(page);
  await assertDatabaseCellRichTexts(page, cellSelector, '12\n3');
});

test('should the multi-select mode work correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '1', true);
  await initDatabaseDynamicRowWithData(page, '2');

  const cell = getFirstColumnCell(page, 'select-selected');
  expect(await cell.count()).toBe(2);
  expect(await cell.nth(0).innerText()).toBe('1');
  expect(await cell.nth(1).innerText()).toBe('2');
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
  await focusDatabaseSearch(page);
  await db.mouseLeave();
  await expect(toolbar).toBeVisible();

  await clickDatabaseOutside(page);
  await expect(toolbar).toBeHidden();

  await db.mouseOver();
  await focusDatabaseSearch(page);
  await type(page, '1');
  await clickDatabaseOutside(page);
  await expect(toolbar).toBeVisible();
});

test('should database search work', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseRowWithData(page, 'text1');
  await initDatabaseDynamicRowWithData(page, '123', false);
  await initDatabaseRowWithData(page, 'text2');
  await initDatabaseDynamicRowWithData(page, 'a', false);
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
  const cell = page.locator('.select-selected');
  expect(await cell.innerText()).toBe('123');

  // clear search input
  const closeIcon = page.locator('.close-icon');
  await closeIcon.click();
  expect(searchIcon).toBeVisible();
  expect(await rows.count()).toBe(3);
});

test('should database title and rich-text support undo/redo', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await switchColumnType(page, 'rich-text');
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

  await performColumnAction(page, '3', 'rename');
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

  await performColumnAction(page, '3', 'insert-right');
  const columns = page.locator('.affine-database-column');
  expect(await columns.count()).toBe(3);

  await assertDatabaseColumnOrder(page, ['3', '4']);
});

test('should support left insert column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);

  await performColumnAction(page, '3', 'insert-left');
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

  await performColumnAction(page, '3', 'delete');
  expect(await columns.count()).toBe(1);
});

test('should support duplicate column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '123', true);

  await performColumnAction(page, '3', 'duplicate');
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

  await performColumnAction(page, '3', 'move-right');
  await assertDatabaseColumnOrder(page, ['5', '3']);

  await undoByClick(page);
  const titleRow = page.locator('.affine-database-column-header');
  const columnTitle = titleRow.locator('[data-column-id="5"]');
  await columnTitle.click();
  const moveLeft = page.locator('.move-right');
  expect(await moveLeft.count()).toBe(0);
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

  await performColumnAction(page, '5', 'move-left');
  await assertDatabaseColumnOrder(page, ['5', '3']);
});

test.describe('switch column type', () => {
  test('switch to number', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123abc', true);
    await switchColumnType(page, 'number');

    const cell = getFirstColumnCell(page, 'number');
    expect(await cell.innerText()).toBe('');

    await initDatabaseDynamicRowWithData(page, '123abc');
    expect(await cell.innerText()).toBe('123');
  });

  test('switch to rich-text', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123abc', true);
    await switchColumnType(page, 'rich-text');

    // For now, rich-text will only be initialized on click
    // Therefore, for the time being, here is to detect whether there is '.rich-text-container'
    const cell = getFirstColumnCell(page, 'rich-text-container');
    expect(await cell.count()).toBe(1);

    await initDatabaseDynamicRowWithData(page, '123');
    await initDatabaseDynamicRowWithData(page, 'abc');
    const cellSelector = '[data-row-id="4"][data-column-id="3"]';
    await assertDatabaseCellRichTexts(page, cellSelector, '123abc');
  });

  test('switch between multi-select and select', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);
    await initDatabaseDynamicRowWithData(page, 'abc');

    const cell = getFirstColumnCell(page, 'select-selected');
    expect(await cell.count()).toBe(2);

    await switchColumnType(page, 'select', '3', true);
    expect(await cell.count()).toBe(1);
    expect(await cell.innerText()).toBe('123');

    await initDatabaseDynamicRowWithData(page, 'def');
    expect(await cell.innerText()).toBe('def');

    await switchColumnType(page, 'multi-select');
    await initDatabaseDynamicRowWithData(page, '666');
    expect(await cell.count()).toBe(2);
    expect(await cell.nth(0).innerText()).toBe('def');
    expect(await cell.nth(1).innerText()).toBe('666');

    await switchColumnType(page, 'select');
    expect(await cell.count()).toBe(1);
    expect(await cell.innerText()).toBe('def');

    await initDatabaseDynamicRowWithData(page, '888');
    expect(await cell.innerText()).toBe('888');
  });

  test('switch between number and rich-text', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await switchColumnType(page, 'number');

    await initDatabaseDynamicRowWithData(page, '123abc', true);
    const cell = getFirstColumnCell(page, 'number');
    expect(await cell.innerText()).toBe('123');

    await switchColumnType(page, 'rich-text');
    await initDatabaseDynamicRowWithData(page, 'abc');
    const cellSelector = '[data-row-id="4"][data-column-id="3"]';
    await assertDatabaseCellRichTexts(page, cellSelector, '123abc');

    await switchColumnType(page, 'number');
    expect(await cell.innerText()).toBe('');
  });
});

test.describe('select column tag action', () => {
  test('should support select tag renaming', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);
    await initDatabaseDynamicRowWithData(page, 'abc');

    const { cellSelected, selectOption, saveIcon } =
      await performSelectColumnTagAction(page, 'rename');
    await waitNextFrame(page);
    await type(page, '4567abc00');
    const option1 = selectOption.nth(0);
    const input = option1.locator('[data-virgo-text="true"]');
    // The maximum length of the tag name is 10
    expect((await input.innerText()).length).toBe(10);
    expect(await input.innerText()).toBe('1234567abc');
    await saveIcon.click();

    await clickDatabaseOutside(page);
    const selected1 = cellSelected.nth(0);
    const selected2 = cellSelected.nth(1);
    expect(await selected1.innerText()).toBe('1234567abc');
    expect(await selected2.innerText()).toBe('abc');
  });

  test('should support select tag deletion', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);

    const { cellSelected } = await performSelectColumnTagAction(page, 'delete');
    await clickDatabaseOutside(page);
    expect(await cellSelected.count()).toBe(0);
  });
});
