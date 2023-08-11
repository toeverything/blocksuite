import type { ColumnType } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';
import { expect, type Locator, type Page } from '@playwright/test';

import type { RichText } from '../../packages/playground/examples/virgo/test-page.js';
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
  await focusDatabaseHeader(page);
  const editor = getEditorLocator(page);
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
  columnType: ColumnType,
  columnIndex = 1
) {
  const { typeIcon } = await getDatabaseHeaderColumn(page, columnIndex);
  await typeIcon.click();

  await clickColumnType(page, columnType);
}

export function clickColumnType(page: Page, columnType: ColumnType) {
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
    const richText = titleColumnCell?.querySelector('rich-text');
    const editor = richText?.vEditor;
    if (!editor) throw new Error('Cannot find database title column editor');
    return editor.yText.toString();
  }, index);

  expect(text).toBe(title);
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
  const style = await page.evaluate(key => {
    const selectedTag = document.querySelector<HTMLElement>('.select-selected');
    if (!selectedTag) throw new Error('Missing selected tag');
    return selectedTag.style[key];
  }, key);

  expect(style).toBe(value);
}

export async function clickDatabaseOutside(page: Page) {
  const pageTitle = page.locator('.affine-doc-page-block-title');
  await pageTitle.click();
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
  const cellContainer = await page.locator(
    `affine-database-cell-container[data-row-index='${rowIndex}'][data-column-index='${columnIndex}']`
  );

  const cellEditing = cellContainer.locator(
    'affine-database-rich-text-cell-editing'
  );
  const cell = cellContainer.locator('affine-database-rich-text-cell');

  const richText = (await cellEditing.count()) === 0 ? cell : cellEditing;
  const actualTexts = await richText.evaluate(ele => {
    return (ele as RichText).vEditor?.yText.toString();
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
        cell?.querySelector<RichText>('affine-database-link-cell') ??
        cell?.querySelector<RichText>('affine-database-link-cell-editing');
      if (!richText) throw new Error('Missing database rich text cell');
      return richText.vEditor.yText.toString();
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
  (await getDatabaseMouse(page)).mouseOver();

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
  const selection = page.locator('.database-selection');
  const selectionBox = await getBoundingBox(selection);

  const startIndex = rowIndexes[0];
  const endIndex = rowIndexes[1];

  if (startIndex === endIndex) {
    // single row
    const row = getDatabaseBodyRow(page, startIndex);
    const rowBox = await getBoundingBox(row);
    const lastCell = await row
      .locator('affine-database-cell-container')
      .last()
      .boundingBox();
    assertExists(lastCell);
    expect(selectionBox).toEqual({
      x: rowBox.x,
      y: rowBox.y,
      height: rowBox.height,
      width: lastCell.x + lastCell.width - rowBox.x,
    });
  } else {
    // multiple rows
    // Only test at most two lines when testing.
    const startRow = getDatabaseBodyRow(page, startIndex);
    const endRow = getDatabaseBodyRow(page, endIndex);
    const startRowBox = await getBoundingBox(startRow);
    const endRowBox = await getBoundingBox(endRow);
    const lastCell = await startRow
      .locator('affine-database-cell-container')
      .last()
      .boundingBox();
    assertExists(lastCell);
    expect(selectionBox).toEqual({
      x: startRowBox.x,
      y: startRowBox.y,
      width: lastCell.x + lastCell.width - startRowBox.x,
      height: startRowBox.height + endRowBox.height,
    });
  }
}

export async function assertCellsSelection(
  page: Page,
  cellIndexes: {
    start: [rowIndex: number, columnIndex: number];
    end?: [rowIndex: number, columnIndex: number];
  }
) {
  const focus = page.locator('.database-focus');
  const focusBox = await getBoundingBox(focus);
  // const selection = page.locator('.database-selection');
  // const selectionBox = await getBoundingBox(selection);

  const { start, end } = cellIndexes;

  if (!end) {
    // single cell
    const [rowIndex, columnIndex] = start;
    const cell = getDatabaseBodyCell(page, { rowIndex, columnIndex });
    const cellBox = await getBoundingBox(cell);
    expect(focusBox).toEqual({
      x: cellBox.x,
      y: cellBox.y,
      height: cellBox.height + 1,
      width: cellBox.width,
    });
  } else {
    // multi cells
  }

  // const startIndex = cellIndexes[0];
  // const endIndex = cellIndexes[1];

  // if (startIndex === endIndex) {
  //   // single row
  //   const row = getDatabaseBodyRow(page, startIndex);
  //   const rowBox = await getBoundingBox(row);
  //   const lastCell = await row
  //     .locator('affine-database-cell-container')
  //     .last()
  //     .boundingBox();
  //   assertExists(lastCell);
  //   expect(selectionBox).toEqual({
  //     x: rowBox.x,
  //     y: rowBox.y,
  //     height: rowBox.height,
  //     width: lastCell.x + lastCell.width - rowBox.x,
  //   });
  // } else {
  //   // multiple rows
  //   // Only test at most two lines when testing.
  //   const startRow = getDatabaseBodyRow(page, startIndex);
  //   const endRow = getDatabaseBodyRow(page, endIndex);
  //   const startRowBox = await getBoundingBox(startRow);
  //   const endRowBox = await getBoundingBox(endRow);
  //   const lastCell = await startRow
  //     .locator('affine-database-cell-container')
  //     .last()
  //     .boundingBox();
  //   assertExists(lastCell);
  //   expect(selectionBox).toEqual({
  //     x: startRowBox.x,
  //     y: startRowBox.y,
  //     width: lastCell.x + lastCell.width - startRowBox.x,
  //     height: startRowBox.height + endRowBox.height,
  //   });
  // }
}
