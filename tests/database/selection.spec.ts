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
  getFirstColumnCell,
  initDatabaseColumn,
  switchColumnType,
} from './actions.js';

test.describe('row-level selection', () => {
  test('should support pressing esc to trigger row selection', async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '123', true);
    await pressEscape(page);
    const titleColumn = getDatabaseBodyCell(page, {
      rowIndex: 0,
      columnIndex: 0,
      cellClass: 'affine-rich-text',
    });
    const startBox = await getBoundingBox(titleColumn);
    const startX = startBox.x + startBox.width / 2;
    const startY = startBox.y + startBox.height / 2;

    const selectColumn = getFirstColumnCell(page, 'select-selected');
    const endBox = await getBoundingBox(selectColumn);
    const endX = endBox.x + endBox.width / 2;
    const endY = endBox.y + endBox.height / 2;

    await dragBetweenCoords(
      page,
      { x: endX, y: endY },
      { x: startX, y: startY }
    );
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

    const titleColumn = getDatabaseBodyCell(page, {
      rowIndex: 0,
      columnIndex: 0,
      cellClass: 'affine-rich-text',
    });
    const startBox = await getBoundingBox(titleColumn);
    const startX = startBox.x + startBox.width / 2;
    const startY = startBox.y + startBox.height / 2;

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
      { x: startX, y: startY },
      { x: endX, y: endY }
    );

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
    const titleColumn = getDatabaseBodyCell(page, {
      rowIndex: 0,
      columnIndex: 0,
      cellClass: 'affine-rich-text',
    });
    const startBox = await getBoundingBox(titleColumn);
    const startX = startBox.x + startBox.width / 2;
    const startY = startBox.y + startBox.height / 2;

    const selectColumn = getFirstColumnCell(page, 'select-selected').nth(3);
    const endBox = await getBoundingBox(selectColumn);
    const endX = endBox.x + endBox.width / 2;
    const endY = endBox.y + endBox.height / 2;

    await dragBetweenCoords(
      page,
      { x: startX, y: startY },
      { x: endX, y: endY }
    );

    await assertRowsSelection(page, [0, 0]);
  });
});
