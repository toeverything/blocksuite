import { type DatabaseBlockModel } from '@blocksuite/blocks';
import { expect } from '@playwright/test';

import {
  dragBetweenCoords,
  enterPlaygroundRoom,
  focusDatabaseTitle,
  focusRichText,
  getBlockModel,
  getBoundingBox,
  initDatabaseDynamicRowWithData,
  initDatabaseRow,
  initDatabaseRowWithData,
  initEmptyDatabaseState,
  initEmptyDatabaseWithParagraphState,
  pasteByKeyboard,
  pressArrowDown,
  pressArrowLeft,
  pressArrowRight,
  pressBackspace,
  pressEnter,
  pressEscape,
  pressShiftEnter,
  redoByKeyboard,
  selectAllByKeyboard,
  type,
  undoByClick,
  undoByKeyboard,
  waitNextFrame,
} from '../utils/actions/index.js';
import { assertBlockCount, assertBlockProps } from '../utils/asserts.js';
import { test } from '../utils/playwright.js';
import {
  assertColumnWidth,
  assertDatabaseCellRichTexts,
  assertDatabaseSearching,
  assertDatabaseTitleColumnText,
  assertDatabaseTitleText,
  blurDatabaseSearch,
  clickColumnType,
  clickDatabaseOutside,
  focusDatabaseHeader,
  focusDatabaseSearch,
  getDatabaseBodyRow,
  getDatabaseBodyRows,
  getDatabaseHeaderColumn,
  getDatabaseMouse,
  getFirstColumnCell,
  initDatabaseColumn,
  switchColumnType,
} from './actions.js';

test('edit database block title and create new rows', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  const locator = page.locator('affine-database');
  await expect(locator).toBeVisible();
  const dbTitle = 'Database 1';
  await assertBlockProps(page, '2', {
    title: dbTitle,
  });
  await focusDatabaseTitle(page);
  await pressArrowDown(page);
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
  await assertBlockProps(page, '4', {
    flavour: 'affine:paragraph',
  });
  await assertBlockProps(page, '5', {
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
  const { column } = await getDatabaseHeaderColumn(page, 1);
  expect(await column.innerText()).toBe('1');

  await undoByClick(page);
  expect(await column.innerText()).toBe('Column 1');
});

test('should modify the value when the input loses focus', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await switchColumnType(page, 'Number');
  await initDatabaseDynamicRowWithData(page, '1', true);

  await clickDatabaseOutside(page);
  const cell = getFirstColumnCell(page, 'number');
  const text = await cell.textContent();
  expect(text?.trim()).toBe('1');
});

test('should rich-text column support soft enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await switchColumnType(page, 'Text');
  await initDatabaseDynamicRowWithData(page, '123', true);

  const cell = getFirstColumnCell(page, 'affine-database-rich-text');
  await cell.click();
  await pressArrowLeft(page);
  await pressEnter(page);
  await assertDatabaseCellRichTexts(page, { text: '123' });

  await cell.click();
  await pressArrowRight(page);
  await pressArrowLeft(page);
  await pressShiftEnter(page);
  await pressEnter(page);
  await assertDatabaseCellRichTexts(page, { text: '12\n3' });
});

test('should the multi-select mode work correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '1', true);
  await pressEscape(page);
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

  await initDatabaseColumn(page);
  await initDatabaseRow(page);

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
  await pressEscape(page);
  await initDatabaseRowWithData(page, 'text2');
  await initDatabaseDynamicRowWithData(page, 'a', false);
  await pressEscape(page);
  await initDatabaseRowWithData(page, 'text3');
  await initDatabaseDynamicRowWithData(page, '26', false);
  await pressEscape(page);
  // search for '2'
  await focusDatabaseSearch(page);
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
  expect(await rows.count()).toBe(3);
});

test('should database search input displayed correctly', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await focusDatabaseSearch(page);
  await blurDatabaseSearch(page);
  await assertDatabaseSearching(page, false);

  await focusDatabaseSearch(page);
  await type(page, '2');
  await blurDatabaseSearch(page);
  await assertDatabaseSearching(page, true);

  await focusDatabaseSearch(page);
  await pressBackspace(page);
  await blurDatabaseSearch(page);
  await assertDatabaseSearching(page, false);

  await focusDatabaseSearch(page);
  await type(page, '2');
  const closeIcon = page.locator('.close-icon');
  await closeIcon.click();
  await blurDatabaseSearch(page);
  await assertDatabaseSearching(page, false);

  await focusDatabaseSearch(page);
  await type(page, '2');
  await pressEscape(page);
  await blurDatabaseSearch(page);
  await assertDatabaseSearching(page, false);
});

test('should database title and rich-text support undo/redo', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await switchColumnType(page, 'Text');
  await initDatabaseDynamicRowWithData(page, '123', true);
  await undoByKeyboard(page);
  await pressEnter(page);
  await assertDatabaseCellRichTexts(page, { text: '' });
  await redoByKeyboard(page);
  await assertDatabaseCellRichTexts(page, { text: '123' });

  await focusDatabaseTitle(page);
  await pressArrowRight(page, 10);
  await type(page, 'abc');
  await assertDatabaseTitleText(page, 'Database 1abc');
  await undoByKeyboard(page);
  await assertDatabaseTitleText(page, 'Database 1');
  await redoByKeyboard(page);
  await assertDatabaseTitleText(page, 'Database 1abc');
});

test('should support delete database through action menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await focusDatabaseSearch(page);
  const moreAction = page.locator('.more-action');
  await moreAction.click();

  const deleteDb = page.locator('.affine-menu-action', {
    hasText: 'Delete Database',
  });
  await deleteDb.click();
  const db = page.locator('affine-database');
  expect(await db.count()).toBe(0);

  await undoByClick(page);
  expect(await db.count()).toBe(1);
});

test('should support copy database through action menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseWithParagraphState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '123', true);
  await pressEscape(page);
  await initDatabaseDynamicRowWithData(page, 'abc');
  await pressEscape(page);
  await focusDatabaseSearch(page);
  const moreAction = page.locator('.more-action');
  await moreAction.click();

  const copyDb = page.locator('.affine-menu-action', { hasText: 'Copy' });
  await copyDb.click();

  await focusRichText(page, 1);
  await pasteByKeyboard(page);
  await waitNextFrame(page);
  await assertBlockCount(page, 'database', 2);
  const db1Model = (await getBlockModel(page, '2')) as DatabaseBlockModel;
  const db2Model = (await getBlockModel(page, '7')) as DatabaseBlockModel;
  expect(db1Model.title.toString()).toEqual(db2Model.title.toString());
});

test('should support drag to change column width', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  const headerColumns = page.locator('.affine-database-column');
  const titleColumn = headerColumns.nth(0);
  const normalColumn = headerColumns.nth(1);

  const dragDistance = 100;
  const titleColumnWidth = 432;
  const normalColumnWidth = 200;

  await assertColumnWidth(titleColumn, titleColumnWidth);
  const box = await assertColumnWidth(normalColumn, normalColumnWidth);

  await dragBetweenCoords(
    page,
    { x: box.x, y: box.y },
    { x: box.x + dragDistance, y: box.y },
    {
      steps: 50,
      beforeMouseUp: async () => {
        await waitNextFrame(page);
      },
    }
  );

  await assertColumnWidth(titleColumn, titleColumnWidth + dragDistance + 1);
  await assertColumnWidth(normalColumn, normalColumnWidth);

  await undoByClick(page);
  await assertColumnWidth(titleColumn, titleColumnWidth);
  await assertColumnWidth(normalColumn, normalColumnWidth);
});

test('should display the add column button on the right side of database correctly', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  const normalColumn = page.locator('.affine-database-column').nth(1);

  const addColumnBtn = page.locator('.affine-database-add-column-button');
  await expect(addColumnBtn).toBeHidden();

  const box = await getBoundingBox(normalColumn);
  await dragBetweenCoords(
    page,
    { x: box.x, y: box.y },
    { x: box.x + 120, y: box.y },
    {
      steps: 50,
      beforeMouseUp: async () => {
        await waitNextFrame(page);
      },
    }
  );
  await focusDatabaseHeader(page);
  await expect(addColumnBtn).toBeVisible();

  await undoByClick(page);
  await expect(addColumnBtn).toBeHidden();
});

test('should support drag and drop to move columns', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page, 'column1');
  await initDatabaseColumn(page, 'column2');
  await initDatabaseColumn(page, 'column3');

  const column1 = await focusDatabaseHeader(page, 1);
  const moveIcon = column1.locator('.affine-database-column-move');
  const moveIconBox = await getBoundingBox(moveIcon);
  const x = moveIconBox.x + moveIconBox.width / 2;
  const y = moveIconBox.y + moveIconBox.height / 2;

  await dragBetweenCoords(
    page,
    { x, y },
    { x: x + 100, y },
    {
      steps: 50,
      beforeMouseUp: async () => {
        await waitNextFrame(page);
        const indicator = page.locator('.database-move-column-drop-preview');
        await expect(indicator).toBeVisible();

        const { box } = await getDatabaseHeaderColumn(page, 2);
        const indicatorBox = await getBoundingBox(indicator);
        expect(box.x + box.width - indicatorBox.x < 10).toBe(true);
      },
    }
  );

  const { text } = await getDatabaseHeaderColumn(page, 2);
  expect(text).toBe('column1');
});

test('support drag and drop the add button to insert row', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, 'a', true);
  await pressEscape(page);
  await initDatabaseDynamicRowWithData(page, 'b', true);
  await pressEscape(page);
  await focusDatabaseHeader(page);
  const newRecord = page.locator('.new-record');
  const box = await getBoundingBox(newRecord);

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const row0 = getDatabaseBodyRow(page, 0);
  const box0 = await getBoundingBox(row0);
  const endX = box0.x + box0.width / 2;
  const endY = box0.y;
  await dragBetweenCoords(
    page,
    { x: startX, y: startY },
    // The drag judgment range is: [-20, 20]
    { x: endX, y: endY - 21 },
    {
      steps: 50,
      beforeMouseUp: async () => {
        await waitNextFrame(page);
        await expect(page.locator('affine-drag-indicator div')).toBeHidden();
      },
    }
  );

  await dragBetweenCoords(
    page,
    { x: startX, y: startY },
    { x: endX, y: endY },
    {
      steps: 50,
      beforeMouseUp: async () => {
        await waitNextFrame(page);
        await expect(page.locator('affine-drag-indicator div')).toBeVisible();
      },
    }
  );
  const rows = getDatabaseBodyRows(page);
  expect(await rows.count()).toBe(3);
  await waitNextFrame(page, 50);
  await type(page, '1');
  await waitNextFrame(page);
  await assertDatabaseTitleColumnText(page, '1');
});

test('should the indicator display correctly when resize the window', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, 'a', true);
  await pressEscape(page);
  await initDatabaseDynamicRowWithData(page, 'b', true);
  await pressEscape(page);

  const size = page.viewportSize();
  if (!size) throw new Error('Missing page size');
  await page.setViewportSize({
    width: size.width - 100,
    height: size.height - 100,
  });
  await page.waitForTimeout(250);

  await focusDatabaseHeader(page);
  const newRecord = page.locator('.new-record');
  const box = await getBoundingBox(newRecord);

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const row0 = getDatabaseBodyRow(page, 0);
  const box0 = await getBoundingBox(row0);
  const endX = box0.x + box0.width / 2;
  const endY = box0.y;

  await dragBetweenCoords(
    page,
    { x: startX, y: startY },
    { x: endX, y: endY },
    {
      steps: 50,
      beforeMouseUp: async () => {
        await waitNextFrame(page);
        const { x: indicatorX } = await getBoundingBox(
          page.locator('affine-drag-indicator div')
        );
        const { x: databaseX } = await getBoundingBox(
          page.locator('affine-database')
        );
        expect(indicatorX).toBe(databaseX);
      },
    }
  );
});

test('should title column support quick renaming', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, 'a', true);
  await pressEscape(page);
  await focusDatabaseHeader(page, 1);
  const { textElement } = await getDatabaseHeaderColumn(page, 1);
  await textElement.click();
  await waitNextFrame(page);
  await selectAllByKeyboard(page);
  await type(page, '123');
  await pressEnter(page);
  expect(await textElement.innerText()).toBe('123');

  await undoByClick(page);
  expect(await textElement.innerText()).toBe('Column 1');
  await textElement.click();
  await waitNextFrame(page);
  await selectAllByKeyboard(page);
  await type(page, '123');
  await pressEnter(page);
  expect(await textElement.innerText()).toBe('123');
});

test('should title column support quick changing of column type', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, 'a', true);
  await pressEscape(page);
  await initDatabaseDynamicRowWithData(page, 'b');
  await pressEscape(page);
  await focusDatabaseHeader(page, 1);
  const { typeIcon } = await getDatabaseHeaderColumn(page, 1);
  await typeIcon.click();
  await waitNextFrame(page);
  await clickColumnType(page, 'Select');
  const cell = getFirstColumnCell(page, 'select-selected');
  expect(await cell.count()).toBe(1);
});
