import type {
  RichTextCell,
  RichTextCellEditing,
} from '@blocks/database-block/properties/rich-text/cell-renderer.js';

import { press } from '@inline/__tests__/utils.js';
import { ZERO_WIDTH_SPACE } from '@inline/consts.js';
import { expect, type Locator, type Page } from '@playwright/test';

import {
  pressEnter,
  pressEscape,
  selectAllByKeyboard,
  type,
} from '../utils/actions/keyboard.js';
import {
  getBoundingBox,
  getBoundingClientRect,
  getEditorLocator,
  waitNextFrame,
} from '../utils/actions/misc.js';

export async function initDatabaseColumn(page: Page, title = '') {
  const editor = getEditorLocator(page);
  await editor.locator('affine-data-view-table-group').first().hover();
  const columnAddBtn = editor.locator('.header-add-column-button');
  await columnAddBtn.click();
  await waitNextFrame(page, 100);

  if (title) {
    await selectAllByKeyboard(page);
    await type(page, title);
    await waitNextFrame(page);
    await pressEnter(page);
  } else {
    await pressEscape(page);
  }
}

export const renameColumn = async (page: Page, name: string) => {
  const column = page.locator('affine-database-header-column', {
    hasText: name,
  });
  await column.click();
};

export async function performColumnAction(
  page: Page,
  name: string,
  action: string
) {
  await renameColumn(page, name);

  const actionMenu = page.locator(`.affine-menu-action`, { hasText: action });
  await actionMenu.click();
}

export async function switchColumnType(
  page: Page,
  columnType: string,
  columnIndex = 1
) {
  const { typeIcon } = await getDatabaseHeaderColumn(page, columnIndex);
  await typeIcon.click();

  await clickColumnType(page, columnType);
}

export function clickColumnType(page: Page, columnType: string) {
  const typeMenu = page.locator(`.affine-menu-action`, {
    hasText: new RegExp(`${columnType}`),
  });
  return typeMenu.click();
}

export function getDatabaseBodyRows(page: Page) {
  const rowContainer = page.locator('.affine-database-block-rows');
  return rowContainer.locator('.database-row');
}

export function getDatabaseBodyRow(page: Page, rowIndex = 0) {
  const rows = getDatabaseBodyRows(page);
  return rows.nth(rowIndex);
}

export function getDatabaseTableContainer(page: Page) {
  const container = page.locator('.affine-database-table-container');
  return container;
}

export async function assertDatabaseTitleColumnText(
  page: Page,
  title: string,
  index = 0
) {
  const text = await page.evaluate(index => {
    const rowContainer = document.querySelector('.affine-database-block-rows');
    const row = rowContainer?.querySelector(
      `.database-row:nth-child(${index + 1})`
    );
    const titleColumnCell = row?.querySelector('.database-cell:nth-child(1)');
    const titleSpan = titleColumnCell?.querySelector(
      '.data-view-header-area-rich-text'
    ) as HTMLElement;
    if (!titleSpan) throw new Error('Cannot find database title column editor');
    return titleSpan.innerText;
  }, index);

  if (title === '') {
    expect(text).toMatch(new RegExp(`^(|[${ZERO_WIDTH_SPACE}])$`));
  } else {
    expect(text).toBe(title);
  }
}

export function getDatabaseBodyCell(
  page: Page,
  {
    rowIndex,
    columnIndex,
  }: {
    rowIndex: number;
    columnIndex: number;
  }
) {
  const row = getDatabaseBodyRow(page, rowIndex);
  const cell = row.locator('.database-cell').nth(columnIndex);
  return cell;
}

export function getDatabaseBodyCellContent(
  page: Page,
  {
    rowIndex,
    columnIndex,
    cellClass,
  }: {
    rowIndex: number;
    columnIndex: number;
    cellClass: string;
  }
) {
  const cell = getDatabaseBodyCell(page, { rowIndex, columnIndex });
  const cellContent = cell.locator(`.${cellClass}`);
  return cellContent;
}

export function getFirstColumnCell(page: Page, cellClass: string) {
  const cellContent = getDatabaseBodyCellContent(page, {
    rowIndex: 0,
    columnIndex: 1,
    cellClass,
  });
  return cellContent;
}

export async function clickSelectOption(page: Page, index = 0) {
  await page.locator('.select-option-icon').nth(index).click();
}

export async function performSelectColumnTagAction(
  page: Page,
  name: string,
  index = 0
) {
  await clickSelectOption(page, index);
  await page
    .locator('.affine-menu-action', { hasText: new RegExp(name) })
    .click();
}

export async function assertSelectedStyle(
  page: Page,
  key: keyof CSSStyleDeclaration,
  value: string
) {
  const style = await getElementStyle(page, '.select-selected', key);
  expect(style).toBe(value);
}

export async function clickDatabaseOutside(page: Page) {
  const docTitle = page.locator('.doc-title-container');
  await docTitle.click();
}

export async function assertColumnWidth(locator: Locator, width: number) {
  const box = await getBoundingBox(locator);
  expect(box.width).toBe(width);
  return box;
}

export async function assertDatabaseCellRichTexts(
  page: Page,
  {
    rowIndex = 0,
    columnIndex = 1,
    text,
  }: {
    rowIndex?: number;
    columnIndex?: number;
    text: string;
  }
) {
  const cellContainer = page.locator(
    `affine-database-cell-container[data-row-index='${rowIndex}'][data-column-index='${columnIndex}']`
  );

  const cellEditing = cellContainer.locator(
    'affine-database-rich-text-cell-editing'
  );
  const cell = cellContainer.locator('affine-database-rich-text-cell');

  const richText = (await cellEditing.count()) === 0 ? cell : cellEditing;
  const actualTexts = await richText.evaluate(ele => {
    return (ele as RichTextCellEditing).inlineEditor?.yTextString;
  });
  expect(actualTexts).toEqual(text);
}

export async function assertDatabaseCellNumber(
  page: Page,
  {
    rowIndex = 0,
    columnIndex = 1,
    text,
  }: {
    rowIndex?: number;
    columnIndex?: number;
    text: string;
  }
) {
  const actualText = await page
    .locator('.affine-database-block-rows')
    .locator('.database-row')
    .nth(rowIndex)
    .locator('.database-cell')
    .nth(columnIndex)
    .locator('.number')
    .textContent();
  expect(actualText?.trim()).toEqual(text);
}

export async function assertDatabaseCellLink(
  page: Page,
  {
    rowIndex = 0,
    columnIndex = 1,
    text,
  }: {
    rowIndex?: number;
    columnIndex?: number;
    text: string;
  }
) {
  const actualTexts = await page.evaluate(
    ({ rowIndex, columnIndex }) => {
      const rows = document.querySelector('.affine-database-block-rows');
      const row = rows?.querySelector(
        `.database-row:nth-child(${rowIndex + 1})`
      );
      const cell = row?.querySelector(
        `.database-cell:nth-child(${columnIndex + 1})`
      );
      const richText =
        cell?.querySelector<RichTextCell>('affine-database-link-cell') ??
        cell?.querySelector<RichTextCellEditing>(
          'affine-database-link-cell-editing'
        );
      if (!richText) throw new Error('Missing database rich text cell');
      return richText.inlineEditor.yText.toString();
    },
    { rowIndex, columnIndex }
  );
  expect(actualTexts).toEqual(text);
}

export async function assertDatabaseTitleText(page: Page, text: string) {
  const dbTitle = page.locator('[data-block-is-database-title="true"]');
  expect(await dbTitle.textContent()).toEqual(text);
}

export async function waitSearchTransitionEnd(page: Page) {
  await waitNextFrame(page, 400);
}

export async function assertDatabaseSearching(
  page: Page,
  isSearching: boolean
) {
  const searchExpand = page.locator('.search-container-expand');
  const count = await searchExpand.count();
  expect(count).toBe(isSearching ? 1 : 0);
}

export async function focusDatabaseSearch(page: Page) {
  await (await getDatabaseMouse(page)).mouseOver();

  const searchExpand = page.locator('.search-container-expand');
  const count = await searchExpand.count();
  if (count === 1) {
    const input = page.locator('.affine-database-search-input');
    await input.click();
  } else {
    const searchIcon = page.locator('.affine-database-search-input-icon');
    await searchIcon.click();
    await waitSearchTransitionEnd(page);
  }
}

export async function blurDatabaseSearch(page: Page) {
  const dbTitle = page.locator('[data-block-is-database-title="true"]');
  await dbTitle.click();
}

export async function focusDatabaseHeader(page: Page, columnIndex = 0) {
  const column = page.locator('.affine-database-column').nth(columnIndex);
  const box = await getBoundingBox(column);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await waitNextFrame(page);
  return column;
}

export async function getDatabaseMouse(page: Page) {
  const databaseRect = await getBoundingClientRect(
    page,
    '.affine-database-table'
  );
  return {
    mouseOver: async () => {
      await page.mouse.move(databaseRect.x, databaseRect.y);
    },
    mouseLeave: async () => {
      await page.mouse.move(databaseRect.x - 1, databaseRect.y - 1);
    },
  };
}

export async function getDatabaseHeaderColumn(page: Page, index = 0) {
  const column = page.locator('.affine-database-column').nth(index);
  const box = await getBoundingBox(column);
  const textElement = column.locator('.affine-database-column-text-input');
  const text = await textElement.innerText();
  const typeIcon = column.locator('.affine-database-column-type-icon');

  return {
    column,
    box,
    text,
    textElement,
    typeIcon,
  };
}

export async function assertRowsSelection(
  page: Page,
  rowIndexes: [start: number, end: number]
) {
  const rows = page.locator('data-view-table-row');
  const startIndex = rowIndexes[0];
  const endIndex = rowIndexes[1];
  for (let i = startIndex; i <= endIndex; i++) {
    const row = rows.nth(i);
    await row.locator('.row-select-checkbox .selected').isVisible();
  }
}

export async function assertCellsSelection(
  page: Page,
  cellIndexes: {
    start: [rowIndex: number, columnIndex: number];
    end?: [rowIndex: number, columnIndex: number];
  }
) {
  const { start, end } = cellIndexes;

  if (!end) {
    // single cell
    const focus = page.locator('.database-focus');
    const focusBox = await getBoundingBox(focus);

    const [rowIndex, columnIndex] = start;
    const cell = getDatabaseBodyCell(page, { rowIndex, columnIndex });
    const cellBox = await getBoundingBox(cell);
    expect(focusBox).toEqual({
      x: cellBox.x,
      y: cellBox.y - 1,
      height: cellBox.height + 2,
      width: cellBox.width + 1,
    });
  } else {
    // multi cells
    const selection = page.locator('.database-selection');
    const selectionBox = await getBoundingBox(selection);

    const [startRowIndex, startColumnIndex] = start;
    const [endRowIndex, endColumnIndex] = end;

    const rowIndexStart = Math.min(startRowIndex, endRowIndex);
    const rowIndexEnd = Math.max(startRowIndex, endRowIndex);
    const columnIndexStart = Math.min(startColumnIndex, endColumnIndex);
    const columnIndexEnd = Math.max(startColumnIndex, endColumnIndex);

    let height = 0;
    let width = 0;
    let x = 0;
    let y = 0;
    for (let i = rowIndexStart; i <= rowIndexEnd; i++) {
      const cell = getDatabaseBodyCell(page, {
        rowIndex: i,
        columnIndex: columnIndexStart,
      });
      const box = await getBoundingBox(cell);
      height += box.height + 1;
      if (i === rowIndexStart) {
        y = box.y;
      }
    }

    for (let j = columnIndexStart; j <= columnIndexEnd; j++) {
      const cell = getDatabaseBodyCell(page, {
        rowIndex: rowIndexStart,
        columnIndex: j,
      });
      const box = await getBoundingBox(cell);
      width += box.width;
      if (j === columnIndexStart) {
        x = box.x;
      }
    }

    expect(selectionBox).toEqual({
      x,
      y,
      height,
      width,
    });
  }
}

export async function getElementStyle(
  page: Page,
  selector: string,
  key: keyof CSSStyleDeclaration
) {
  const style = await page.evaluate(
    ({ key, selector }) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) throw new Error(`Missing ${selector} tag`);
      // @ts-ignore
      return el.style[key];
    },
    {
      key,
      selector,
    }
  );

  return style;
}

export async function focusKanbanCardHeader(page: Page, index = 0) {
  const cardHeader = page.locator('data-view-header-area-text').nth(index);
  await cardHeader.click();
}

export async function assertKanbanCellSelected(
  page: Page,
  {
    groupIndex,
    cardIndex,
    cellIndex,
  }: {
    groupIndex: number;
    cardIndex: number;
    cellIndex: number;
  }
) {
  const border = await page.evaluate(
    ({ groupIndex, cardIndex, cellIndex }) => {
      const group = document.querySelector(
        `affine-data-view-kanban-group:nth-child(${groupIndex + 1})`
      );
      const card = group?.querySelector(
        `affine-data-view-kanban-card:nth-child(${cardIndex + 1})`
      );
      const cells = Array.from(
        card?.querySelectorAll<HTMLElement>(`affine-data-view-kanban-cell`) ??
          []
      );
      const cell = cells[cellIndex];
      if (!cell) throw new Error(`Missing cell tag`);
      return cell.style.border;
    },
    {
      groupIndex,
      cardIndex,
      cellIndex,
    }
  );

  expect(border).toEqual('1px solid var(--affine-primary-color)');
}

export async function assertKanbanCardSelected(
  page: Page,
  {
    groupIndex,
    cardIndex,
  }: {
    groupIndex: number;
    cardIndex: number;
  }
) {
  const border = await page.evaluate(
    ({ groupIndex, cardIndex }) => {
      const group = document.querySelector(
        `affine-data-view-kanban-group:nth-child(${groupIndex + 1})`
      );
      const card = group?.querySelector<HTMLElement>(
        `affine-data-view-kanban-card:nth-child(${cardIndex + 1})`
      );
      if (!card) throw new Error(`Missing card tag`);
      return card.style.border;
    },
    {
      groupIndex,
      cardIndex,
    }
  );

  expect(border).toEqual('1px solid var(--affine-primary-color)');
}

export function getKanbanCard(
  page: Page,
  {
    groupIndex,
    cardIndex,
  }: {
    groupIndex: number;
    cardIndex: number;
  }
) {
  const group = page.locator('affine-data-view-kanban-group').nth(groupIndex);
  const card = group.locator('affine-data-view-kanban-card').nth(cardIndex);
  return card;
}
export const moveToCenterOf = async (page: Page, locator: Locator) => {
  const box = (await locator.boundingBox())!;
  expect(box).toBeDefined();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
};
export const changeColumnType = async (
  page: Page,
  column: number,
  name: string
) => {
  await waitNextFrame(page);
  await page.locator('affine-database-header-column').nth(column).click();
  await pressKey(page, 'ArrowDown', 2);
  await pressKey(page, 'Enter');
  await type(page, name);
  await pressKey(page, 'ArrowDown');
  await pressKey(page, 'Enter');
};
export const pressKey = async (page: Page, key: string, count: number = 1) => {
  for (let i = 0; i < count; i++) {
    await waitNextFrame(page);
    await press(page, key);
  }
  await waitNextFrame(page);
};
