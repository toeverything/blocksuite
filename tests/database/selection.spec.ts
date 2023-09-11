import { expect } from '@playwright/test';

import { dragBetweenCoords } from '../utils/actions/drag.js';
import {
  pressArrowDown,
  pressArrowUp,
  pressBackspace,
  pressEnter,
  pressEscape,
  type,
} from '../utils/actions/keyboard.js';
import {
  enterPlaygroundRoom,
  getBoundingBox,
  initDatabaseDynamicRowWithData,
  initDatabaseRowWithData,
  initEmptyDatabaseState,
  initKanbanViewState,
  waitNextFrame,
} from '../utils/actions/misc.js';
import { test } from '../utils/playwright.js';
import {
  assertCellsSelection,
  assertDatabaseTitleColumnText,
  assertKanbanCellSelected,
  assertRowsSelection,
  focusKanbanCardHeader,
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

  test("should support move cell's focus by arrow key(up&down) within a card", async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initKanbanViewState(page, {
      rows: ['row1'],
      columns: [
        {
          type: 'number',
          value: [1],
        },
        {
          type: 'rich-text',
          value: ['text'],
        },
      ],
    });

    await focusKanbanCardHeader(page);
    await pressEscape(page);
    await assertKanbanCellSelected(page, {
      // group by `number` column, the first(groupIndex: 0) group is `Ungroups`
      groupIndex: 1,
      cardIndex: 0,
      cellIndex: 0,
    });

    await pressArrowDown(page, 3);
    await assertKanbanCellSelected(page, {
      groupIndex: 1,
      cardIndex: 0,
      cellIndex: 0,
    });

    await pressArrowUp(page);
    await assertKanbanCellSelected(page, {
      groupIndex: 1,
      cardIndex: 0,
      cellIndex: 2,
    });
  });

  test("should support move cell's focus by arrow key(up&down) within multi cards", async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initKanbanViewState(page, {
      rows: ['row1', 'row2'],
      columns: [
        {
          type: 'number',
          value: [1, 2],
        },
        {
          type: 'rich-text',
          value: ['text'],
        },
      ],
    });

    await focusKanbanCardHeader(page);
    await pressEscape(page);
    await pressArrowUp(page);
    await assertKanbanCellSelected(page, {
      groupIndex: 1,
      cardIndex: 1,
      cellIndex: 2,
    });

    await pressArrowDown(page);
    await assertKanbanCellSelected(page, {
      groupIndex: 1,
      cardIndex: 0,
      cellIndex: 0,
    });
  });
});

test.describe('row-level selection', () => {
  test('should support title selection', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseRowWithData(page, 'title');
    await pressEscape(page);
    await waitNextFrame(page, 100);
    await assertCellsSelection(page, {
      start: [0, 0],
    });

    await pressEscape(page);
    await assertRowsSelection(page, [0, 0]);
  });

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

test.describe('cell-level selection', () => {
  test('should support multi cell selection', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '', true);
    await pressEscape(page);
    await switchColumnType(page, 'Number');
    await initDatabaseDynamicRowWithData(page, '123', true);

    const startCell = getDatabaseBodyCell(page, {
      rowIndex: 0,
      columnIndex: 0,
    });
    const endCell = getDatabaseBodyCell(page, {
      rowIndex: 1,
      columnIndex: 1,
    });

    const startBox = await getBoundingBox(startCell);
    const endBox = await getBoundingBox(endCell);

    const startX = startBox.x + startBox.width / 2;
    const startY = startBox.y + startBox.height / 2;
    const endX = endBox.x + endBox.width / 2;
    const endY = endBox.y + endBox.height / 2;

    await dragBetweenCoords(
      page,
      { x: startX, y: startY },
      { x: endX, y: endY }
    );

    await assertCellsSelection(page, {
      start: [0, 0],
      end: [1, 1],
    });
  });

  test("should support backspace key to delete cell's content", async ({
    page,
  }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseRowWithData(page, 'row1');
    await initDatabaseDynamicRowWithData(page, 'abc', false);
    await pressEscape(page);
    await initDatabaseRowWithData(page, 'row2');
    await initDatabaseDynamicRowWithData(page, '123', false);
    await pressEscape(page);

    const startCell = getDatabaseBodyCell(page, {
      rowIndex: 0,
      columnIndex: 0,
    });
    const endCell = getDatabaseBodyCell(page, {
      rowIndex: 1,
      columnIndex: 1,
    });

    const startBox = await getBoundingBox(startCell);
    const endBox = await getBoundingBox(endCell);

    const startX = startBox.x + startBox.width / 2;
    const startY = startBox.y + startBox.height / 2;
    const endX = endBox.x + endBox.width / 2;
    const endY = endBox.y + endBox.height / 2;

    await dragBetweenCoords(
      page,
      { x: startX, y: startY },
      { x: endX, y: endY }
    );

    await pressBackspace(page);
    await assertDatabaseTitleColumnText(page, '', 0);
    await assertDatabaseTitleColumnText(page, '', 1);
    const selectCell1 = getDatabaseBodyCell(page, {
      rowIndex: 0,
      columnIndex: 1,
    });
    expect(await selectCell1.innerText()).toBe('');
    const selectCell2 = getDatabaseBodyCell(page, {
      rowIndex: 1,
      columnIndex: 1,
    });
    expect(await selectCell2.innerText()).toBe('');
  });
});
