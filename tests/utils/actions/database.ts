import type { ColumnType } from '@blocksuite/global/database';
import { expect, type Locator, type Page } from '@playwright/test';

import type { RichText } from '../../../packages/playground/examples/virgo/test-page.js';
import { assertClassName } from '../asserts.js';
import { pressEnter, pressEscape, type } from './keyboard.js';
import {
  getBoundingBox,
  getBoundingClientRect,
  waitNextFrame,
} from './misc.js';

export async function initDatabaseColumn(page: Page, title = '') {
  await focusDatabaseHeader(page);
  const columnAddBtn = page.locator('.header-add-column-button');
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

  const typeMenu = page.locator(`.action.${columnType}`);
  await typeMenu.click();
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
  await action.click();

  return {
    cellSelected: cell.locator('.select-selected'),
    selectOption: selectOptions,
    saveIcon: actionIcon,
  };
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
      const cellEditContainer = cell?.querySelector(
        'affine-database-cell-container'
      );
      const richText = cellEditContainer?.shadowRoot?.querySelector<RichText>(
        'affine-database-rich-text-cell'
      );
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
  const databaseRect = await getBoundingClientRect(page, 'affine-database');
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

  return {
    column,
    box,
    text,
    textElement,
  };
}
