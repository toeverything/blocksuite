import type { ColumnType } from '@blocksuite/blocks';
import { expect, type Locator, type Page } from '@playwright/test';

import type { RichText } from '../../packages/playground/examples/virgo/test-page.js';
import { pressEnter, pressEscape, type } from '../utils/actions/keyboard.js';
import {
  getBoundingBox,
  getBoundingClientRect,
  getEditorLocator,
  waitNextFrame,
} from '../utils/actions/misc.js';
import { assertClassName } from '../utils/asserts.js';

export async function initDatabaseColumn(page: Page, title = '') {
  await focusDatabaseHeader(page);
  const editor = getEditorLocator(page);
  const columnAddBtn = editor.locator('.header-add-column-button');
  await columnAddBtn.click();
  await waitNextFrame(page);

  if (title) {
    await type(page, title);
    await waitNextFrame(page);
    await pressEnter(page);
  } else {
    await pressEscape(page);
  }
}

export async function performColumnAction(
  page: Page,
  columnId: string,
  action: string
) {
  const titleRow = page.locator('.affine-database-column-header');
  const columnTitle = titleRow.locator(`[data-column-id="${columnId}"]`);
  await columnTitle.click();

  const actionMenu = page.locator(`.${action}`);
  await actionMenu.click();
}

export async function switchColumnType(
  page: Page,
  columnType: ColumnType,
  columnIndex = 1,
  isDefault = false
) {
  const { column } = await getDatabaseHeaderColumn(page, columnIndex);
  await column.click();

  await waitNextFrame(page);
  const action = page.locator('.column-type');
  const box = await getBoundingBox(action);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await waitNextFrame(page, 300);

  if (isDefault) {
    await assertClassName(
      page,
      '.action.multi-select',
      /action multi-select selected/
    );
  }

  await clickColumnType(page, columnType);
}

export function clickColumnType(page: Page, columnType: ColumnType) {
  const typeMenu = page.locator(`.action.${columnType}`);
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
    cellClass,
  }: {
    rowIndex: number;
    columnIndex: number;
    cellClass: string;
  }
) {
  const row = getDatabaseBodyRow(page, rowIndex);
  const cell = row.locator('.database-cell').nth(columnIndex);
  const cellContent = cell.locator(`.${cellClass}`);
  return cellContent;
}

export function getFirstColumnCell(page: Page, cellClass: string) {
  const cellContent = getDatabaseBodyCell(page, {
    rowIndex: 0,
    columnIndex: 1,
    cellClass,
  });
  return cellContent;
}

export async function performSelectColumnTagAction(
  page: Page,
  actionClass: string,
  operation: 'click' | 'hover' = 'click',
  index = 0
) {
  const cell = getFirstColumnCell(
    page,
    'affine-database-select-cell-container'
  );
  await cell.click();

  const selectOptions = page.locator('.select-option');
  const selectOption = selectOptions.nth(index);
  const box = await selectOption.boundingBox();
  if (!box) throw new Error('Missing select tag option');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  const actionIcon = selectOption.locator('.select-option-icon');
  await actionIcon.click();
  const action = page.locator(`.${actionClass}`);
  if (operation === 'click') {
    await action.click();
  } else if (operation === 'hover') {
    await action.hover();
    const firstColorOption = page.locator('.option-color').nth(0);
    await firstColorOption.click();
    await clickDatabaseOutside(page);
  }

  return {
    cellSelected: cell.locator('.select-selected'),
    selectOption: selectOptions,
    saveIcon: actionIcon,
  };
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
  const pageTitle = page.locator('.affine-default-page-block-title');
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
        cell?.querySelector<RichText>('affine-database-rich-text-cell') ??
        cell?.querySelector<RichText>('affine-database-rich-text-cell-editing');
      if (!richText) throw new Error('Missing database rich text cell');
      return richText.vEditor.yText.toString();
    },
    { rowIndex, columnIndex }
  );
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
  const searchContainer = page.locator('.search-container');
  const searchExpand = searchContainer.locator('.search-container-expand');
  const count = await searchExpand.count();
  if (count === 1) {
    const input = searchContainer.locator('.affine-database-search-input');
    await input.click();
  } else {
    const searchIcon = searchContainer.locator(
      '.affine-database-search-input-icon'
    );
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
  const inputElement = column.locator('.affine-database-column-input');
  const text = await textElement.innerText();
  const typeIcon = column.locator('.affine-database-column-type-icon');
  const renameIcon = column.locator('.affine-database-column-text-icon');
  const saveIcon = column.locator('.affine-database-column-text-save-icon');

  return {
    column,
    box,
    text,
    textElement,
    typeIcon,
    renameIcon,
    inputElement,
    saveIcon,
  };
}

export async function assertRowsSelection(
  page: Page,
  rowIndexes: [start: number, end: number]
) {
  const selection = page.locator('.database-row-level-selection');
  const selectionBox = await getBoundingBox(selection);

  const startIndex = rowIndexes[0];
  const endIndex = rowIndexes[1];

  if (startIndex === endIndex) {
    // single row
    const row = getDatabaseBodyRow(page, startIndex);
    const rowBox = await getBoundingBox(row);
    expect(selectionBox).toEqual(rowBox);
  } else {
    // multiple rows
    // Only test at most two lines when testing.
    const startRow = getDatabaseBodyRow(page, startIndex);
    const endRow = getDatabaseBodyRow(page, endIndex);
    const startRowBox = await getBoundingBox(startRow);
    const endRowBox = await getBoundingBox(endRow);
    expect(selectionBox).toEqual({
      x: startRowBox.x,
      y: startRowBox.y,
      width: startRowBox.width,
      height: startRowBox.height + endRowBox.height,
    });
  }
}
