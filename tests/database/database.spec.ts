import { type DatabaseBlockModel } from '@blocksuite/blocks';
import { expect } from '@playwright/test';

import {
  assertDatabaseColumnOrder,
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
  pressArrowLeft,
  pressArrowRight,
  pressBackspace,
  pressEnter,
  pressEscape,
  pressShiftEnter,
  redoByClick,
  redoByKeyboard,
  type,
  undoByClick,
  undoByKeyboard,
  waitNextFrame,
} from '../utils/actions/index.js';
import {
  assertBlockCount,
  assertBlockProps,
  assertLocatorVisible,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';
import {
  assertColumnWidth,
  assertDatabaseCellNumber,
  assertDatabaseCellRichTexts,
  assertDatabaseSearching,
  assertDatabaseTitleColumnText,
  assertDatabaseTitleText,
  assertSelectedStyle,
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
  performColumnAction,
  performSelectColumnTagAction,
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
  await switchColumnType(page, 'number');
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
  await switchColumnType(page, 'rich-text');
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
  await assertDatabaseCellRichTexts(page, { text: '12\n3' });
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
  await initDatabaseRowWithData(page, 'text2');
  await initDatabaseDynamicRowWithData(page, 'a', false);
  await initDatabaseRowWithData(page, 'text3');
  await initDatabaseDynamicRowWithData(page, '26', false);

  // search for '2'
  await focusDatabaseSearch(page);
  await type(page, '2');
  const rows = page.locator('.affine-database-block-row');
  expect(await rows.count()).toBe(3);

  // search for '23'
  await type(page, '3');
  expect(await rows.count()).toBe(1);
  // click searchIcon when opening
  const searchIcon = page.locator('.affine-database-search-input-icon');
  await searchIcon.click();
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
  await switchColumnType(page, 'rich-text');
  await initDatabaseDynamicRowWithData(page, '123', true);
  await pressArrowLeft(page);
  await undoByKeyboard(page);
  await assertDatabaseCellRichTexts(page, { text: '' });
  await redoByKeyboard(page);
  await assertDatabaseCellRichTexts(page, { text: '123' });

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

  const { textElement, inputElement } = await getDatabaseHeaderColumn(page, 1);
  expect(await textElement.innerText()).toBe('abc');

  await performColumnAction(page, '4', 'rename');
  await inputElement.click();
  await type(page, '123');
  await pressEnter(page);
  expect(await textElement.innerText()).toBe('abc123');

  await undoByClick(page);
  expect(await textElement.innerText()).toBe('abc');
  await redoByClick(page);
  expect(await textElement.innerText()).toBe('abc123');
});

test('should support add new column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '123', true);

  const { text: title1 } = await getDatabaseHeaderColumn(page, 1);
  expect(title1).toBe('Column 1');

  const selected = getFirstColumnCell(page, 'select-selected');
  expect(await selected.innerText()).toBe('123');

  await initDatabaseColumn(page, 'abc');
  const { text: title2 } = await getDatabaseHeaderColumn(page, 2);
  expect(title2).toBe('abc');

  await initDatabaseColumn(page);
  const { text: title3 } = await getDatabaseHeaderColumn(page, 3);
  expect(title3).toBe('Column 3');
});

test('should support right insert column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);

  await performColumnAction(page, '4', 'insert-right');
  const columns = page.locator('.affine-database-column');
  expect(await columns.count()).toBe(4);

  await assertDatabaseColumnOrder(page, ['4', '5']);
});

test('should support left insert column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);

  await performColumnAction(page, '4', 'insert-left');
  const columns = page.locator('.affine-database-column');
  expect(await columns.count()).toBe(4);

  await assertDatabaseColumnOrder(page, ['5', '4']);
});

test('should support delete column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);

  const columns = page.locator('.affine-database-column');
  expect(await columns.count()).toBe(3);

  await performColumnAction(page, '4', 'delete');
  expect(await columns.count()).toBe(2);
});

test('should support duplicate column', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, '123', true);

  await performColumnAction(page, '4', 'duplicate');
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
  await assertDatabaseColumnOrder(page, ['4', '6']);

  await performColumnAction(page, '4', 'move-right');
  await assertDatabaseColumnOrder(page, ['6', '4']);

  await undoByClick(page);
  const { column } = await getDatabaseHeaderColumn(page, 2);
  await column.click();
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
  await assertDatabaseColumnOrder(page, ['4', '6']);

  const { column } = await getDatabaseHeaderColumn(page, 0);
  await column.click();
  const moveLeft = page.locator('.move-left');
  expect(await moveLeft.count()).toBe(0);

  await performColumnAction(page, '6', 'move-left');
  await assertDatabaseColumnOrder(page, ['6', '4']);
});

test.describe('switch column type', () => {
  test('switch to number', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123abc', true);
    await switchColumnType(page, 'number');

    const cell = getFirstColumnCell(page, 'number');
    await assertDatabaseCellNumber(page, {
      text: '',
    });

    await initDatabaseDynamicRowWithData(page, '123abc');
    expect((await cell.textContent())?.trim()).toBe('123');
  });

  test('switch to rich-text', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123abc', true);
    await switchColumnType(page, 'rich-text');

    // For now, rich-text will only be initialized on click
    // Therefore, for the time being, here is to detect whether there is '.affine-database-rich-text'
    const cell = getFirstColumnCell(page, 'affine-database-rich-text');
    expect(await cell.count()).toBe(1);

    await initDatabaseDynamicRowWithData(page, '123');
    await initDatabaseDynamicRowWithData(page, 'abc');
    await assertDatabaseCellRichTexts(page, { text: '123abc123abc' });
  });

  test('switch between multi-select and select', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);
    await initDatabaseDynamicRowWithData(page, 'abc');

    const cell = getFirstColumnCell(page, 'select-selected');
    expect(await cell.count()).toBe(2);

    await switchColumnType(page, 'select', 1, true);
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
    getFirstColumnCell(page, 'number');
    await pressEnter(page);
    await clickDatabaseOutside(page);
    await waitNextFrame(page, 100);
    await assertDatabaseCellNumber(page, {
      text: '123',
    });

    await switchColumnType(page, 'rich-text');
    await initDatabaseDynamicRowWithData(page, 'abc');
    await assertDatabaseCellRichTexts(page, { text: '123abc' });

    await switchColumnType(page, 'number');
    await assertDatabaseCellNumber(page, {
      text: '',
    });
  });

  test('switch number to select', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await switchColumnType(page, 'number');

    await initDatabaseDynamicRowWithData(page, '123', true);
    const cell = getFirstColumnCell(page, 'number');
    expect((await cell.textContent())?.trim()).toBe('123');

    await switchColumnType(page, 'select');
    await initDatabaseDynamicRowWithData(page, 'abc');
    const selectCell = getFirstColumnCell(page, 'select-selected');
    expect(await selectCell.innerText()).toBe('abc');

    await switchColumnType(page, 'number');
    await assertDatabaseCellNumber(page, {
      text: '',
    });
  });

  test('switch to checkbox', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '', true);
    await switchColumnType(page, 'checkbox');

    const checkbox = getFirstColumnCell(page, 'checkbox');
    await expect(checkbox).not.toHaveClass('checked');

    await checkbox.click();
    await expect(checkbox).toHaveClass(/checked/);

    await undoByClick(page);
    await expect(checkbox).not.toHaveClass('checked');
  });

  test('switch to progress', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '', true);
    await switchColumnType(page, 'progress');

    const progress = getFirstColumnCell(page, 'progress');
    expect(await progress.textContent()).toBe('0');

    const progressBg = page.locator('.affine-database-progress-bg');
    const {
      x: progressBgX,
      y: progressBgY,
      width: progressBgWidth,
    } = await getBoundingBox(progressBg);
    await page.mouse.move(progressBgX, progressBgY);
    await page.mouse.click(progressBgX, progressBgY);
    const dragHandle = page.locator('.affine-database-progress-drag-handle');
    const {
      x: dragX,
      y: dragY,
      width,
      height,
    } = await getBoundingBox(dragHandle);
    const dragCenterX = dragX + width / 2;
    const dragCenterY = dragY + height / 2;
    await page.mouse.move(dragCenterX, dragCenterY);

    const endX = dragCenterX + progressBgWidth;
    await dragBetweenCoords(
      page,
      { x: dragCenterX, y: dragCenterY },
      { x: endX, y: dragCenterY }
    );
    expect(await progress.textContent()).toBe('100');

    await undoByClick(page);
    expect(await progress.textContent()).toBe('0');
  });
});

test.describe('select column tag action', () => {
  test('should support select tag renaming', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);
    await initDatabaseDynamicRowWithData(page, 'abc');
    await pressEscape(page);
    const { cellSelected, selectOption, saveIcon } =
      await performSelectColumnTagAction(page, 'rename');
    await waitNextFrame(page);
    await type(page, '4567abc00');
    const option1 = selectOption.nth(0);
    const input = option1.locator('[data-virgo-text="true"]');
    expect((await input.innerText()).length).toBe(12);
    expect(await input.innerText()).toBe('1234567abc00');

    await saveIcon.click();
    await clickDatabaseOutside(page);
    const selected1 = cellSelected.nth(0);
    const selected2 = cellSelected.nth(1);
    expect(await selected1.innerText()).toBe('1234567abc00');
    expect(await selected2.innerText()).toBe('abc');
  });

  test('should select tag renaming support shortcut key', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);
    await pressEscape(page);
    const { selectOption } = await performSelectColumnTagAction(page, 'rename');
    await waitNextFrame(page);
    await type(page, '456');
    // esc
    await pressEscape(page);
    const option1 = selectOption.nth(0);
    const input = option1.locator('[data-virgo-text="true"]');
    expect(await input.innerText()).toBe('123');

    await clickDatabaseOutside(page);
    await performSelectColumnTagAction(page, 'rename');
    await waitNextFrame(page);
    await type(page, '456');
    // enter
    await pressEnter(page);
    expect(await input.innerText()).toBe('123456');
  });

  test('should support select tag deletion', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);
    await pressEscape(page);
    const { cellSelected } = await performSelectColumnTagAction(page, 'delete');
    await clickDatabaseOutside(page);
    expect(await cellSelected.count()).toBe(0);
  });

  test('should support modifying select tag color', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);
    await pressEscape(page);
    await performSelectColumnTagAction(page, 'change-color', 'hover');
    await assertSelectedStyle(page, 'backgroundColor', 'var(--affine-tag-red)');
  });
});

test('should support delete database through action menu', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await focusDatabaseSearch(page);
  const moreAction = page.locator('.more-action');
  await moreAction.click();
  const actionPopup = page.locator('affine-database-toolbar-action-popup');
  expect(actionPopup).toBeVisible();

  const deleteDb = page.locator('.delete-database');
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
  await initDatabaseDynamicRowWithData(page, 'abc');

  await focusDatabaseSearch(page);
  const moreAction = page.locator('.more-action');
  await moreAction.click();
  const actionPopup = page.locator('affine-database-toolbar-action-popup');
  await assertLocatorVisible(page, actionPopup);

  const copyDb = page.locator('.copy');
  await copyDb.click();
  expect(await actionPopup.count()).toBe(0);

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

  await assertColumnWidth(titleColumn, titleColumnWidth + dragDistance);
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
        const indicator = page.locator(
          '.affine-database-column-drag-indicator'
        );
        await expect(indicator).toBeVisible();

        const { box } = await getDatabaseHeaderColumn(page, 2);
        const indicatorBox = await getBoundingBox(indicator);
        expect(box.x + box.width).toBe(indicatorBox.x);
      },
    }
  );

  const { text } = await getDatabaseHeaderColumn(page, 3);
  expect(text).toBe('column1');
});

test('support drag and drop the add button to insert row', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, 'a', true);
  await initDatabaseDynamicRowWithData(page, 'b', true);

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
        await expect(page.locator('.affine-drag-indicator')).toBeHidden();
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
        await expect(page.locator('.affine-drag-indicator')).toBeVisible();
      },
    }
  );
  const rows = getDatabaseBodyRows(page);
  expect(await rows.count()).toBe(3);

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
  await initDatabaseDynamicRowWithData(page, 'b', true);

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
          page.locator('.affine-drag-indicator')
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
  await focusDatabaseHeader(page, 1);
  const { textElement, renameIcon, saveIcon } = await getDatabaseHeaderColumn(
    page,
    1
  );
  await renameIcon.click();
  await waitNextFrame(page);
  await type(page, '123');
  await saveIcon.click();
  expect(await textElement.innerText()).toBe('123');

  await undoByClick(page);
  expect(await textElement.innerText()).toBe('Column 1');
  await renameIcon.click();
  await waitNextFrame(page);
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
  await initDatabaseDynamicRowWithData(page, 'b');
  await focusDatabaseHeader(page, 1);
  const { typeIcon, renameIcon } = await getDatabaseHeaderColumn(page, 1);
  await renameIcon.click();
  await typeIcon.click();
  await waitNextFrame(page);
  await clickColumnType(page, 'select');
  const cell = getFirstColumnCell(page, 'select-selected');
  expect(await cell.count()).toBe(1);
});

test('should save the previous header being edited when editing the next column header', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyDatabaseState(page);

  await initDatabaseColumn(page);
  await initDatabaseDynamicRowWithData(page, 'a', true);
  await focusDatabaseHeader(page, 0);
  const { textElement, renameIcon: titleRenameIcon } =
    await getDatabaseHeaderColumn(page, 0);
  await titleRenameIcon.click();
  await type(page, '123');

  const { renameIcon } = await getDatabaseHeaderColumn(page, 1);
  await renameIcon.click();
  expect(await textElement.innerText()).toBe('123');

  await titleRenameIcon.click();
  await type(page, '456');
  await initDatabaseColumn(page);
  expect(await textElement.innerText()).toBe('456');
});
