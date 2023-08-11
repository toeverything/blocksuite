import { dragBetweenCoords } from '../utils/actions/drag.js';
import { pressEnter, pressEscape, type } from '../utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  getBoundingBox,
  initDatabaseDynamicRowWithData,
  initEmptyDatabaseState,
  waitNextFrame,
} from '../utils/actions/misc.js';
import { test } from '../utils/playwright.js';
import {
  assertRowsSelection,
  getDatabaseBodyCell,
  initDatabaseColumn,
  switchColumnType,
} from './actions.js';

test.describe('focus', () => {
  test('should support move focus by arrow key', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);
    await pressEscape(page);
    await waitNextFrame(page, 100);
    await pressEscape(page);
    await assertRowsSelection(page, [0, 0]);
  });

  test('should support multi row selection', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '', true);
    await pressEscape(page);
    await switchColumnType(page, 'Number');
    await initDatabaseDynamicRowWithData(page, '123', true);

    const selectColumn = getDatabaseBodyCell(page, {
      rowIndex: 1,
      columnIndex: 1,
      cellClass: 'number',
    });

    const endBox = await getBoundingBox(selectColumn);
    const endX = endBox.x + endBox.width / 2;

    await dragBetweenCoords(
      page,
      { x: endX, y: endBox.y },
      { x: endX, y: endBox.y + endBox.height }
    );
    await pressEscape(page);
    await assertRowsSelection(page, [0, 1]);
  });

  test('should support row selection with dynamic height', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123123', true);
    await type(page, '456456');
    await pressEnter(page);
    await type(page, 'abcabc');
    await pressEnter(page);
    await type(page, 'defdef');
    await pressEnter(page);
    await pressEscape(page);

    await pressEscape(page);
    await assertRowsSelection(page, [0, 0]);
  });
});

test.describe('row-level selection', () => {
  test('should support pressing esc to trigger row selection', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);
    await pressEscape(page);
    await waitNextFrame(page, 100);
    await pressEscape(page);
    await assertRowsSelection(page, [0, 0]);
  });

  test('should support multi row selection', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '', true);
    await pressEscape(page);
    await switchColumnType(page, 'Number');
    await initDatabaseDynamicRowWithData(page, '123', true);

    const selectColumn = getDatabaseBodyCell(page, {
      rowIndex: 1,
      columnIndex: 1,
      cellClass: 'number',
    });

    const endBox = await getBoundingBox(selectColumn);
    const endX = endBox.x + endBox.width / 2;
    const endY = endBox.y + endBox.height / 2;

    await dragBetweenCoords(
      page,
      { x: endX, y: endBox.y },
      { x: endX, y: endBox.y + endBox.height }
    );
    await pressEscape(page);
    await assertRowsSelection(page, [0, 1]);
  });

  test('should support row selection with dynamic height', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123123', true);
    await type(page, '456456');
    await pressEnter(page);
    await type(page, 'abcabc');
    await pressEnter(page);
    await type(page, 'defdef');
    await pressEnter(page);
    await pressEscape(page);

    await pressEscape(page);
    await assertRowsSelection(page, [0, 0]);
  });
});
