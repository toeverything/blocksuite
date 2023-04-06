import type { ColumnType } from '@blocksuite/global/database';
import { expect, type Locator, type Page } from '@playwright/test';

import { assertClassName } from '../asserts.js';
import {
  getBoundingBox,
  getBoundingClientRect,
  waitNextFrame,
} from './misc.js';

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
  columnId = '3',
  isDefault = false
) {
  const titleRow = page.locator('.affine-database-column-header');
  const columnTitle = titleRow.locator(`[data-column-id="${columnId}"]`);
  await columnTitle.click();

  const action = page.locator('.column-type');
  const box = await action.boundingBox();
  if (!box) throw new Error('Missing column type rect');
  page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

  if (isDefault) {
    await assertClassName(
      page,
      '.action.multi-select',
      /action multi-select selected/
    );
  }

  const typeMenu = page.locator(
    `.affine-database-column-type-popup .${columnType}`
  );
  await typeMenu.click();
}

export function getFirstColumnCell(page: Page, cellClass: string) {
  const cellSelector = '[data-row-id="4"][data-column-id="3"]';
  const cell = page.locator(cellSelector);
  const cellContent = cell.locator(`.${cellClass}`);
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

export async function waitSearchTransitionEnd(page: Page) {
  await waitNextFrame(page, 400);
}

export async function focusDatabaseSearch(page: Page) {
  (await getDatabaseMouse(page)).mouseOver();
  const searchIcon = page.locator('.affine-database-search-input-icon');
  await searchIcon.click();
  await waitSearchTransitionEnd(page);
  return searchIcon;
}

export async function focusDatabaseHeader(page: Page) {
  const header = page.locator('.affine-database-column-header');
  const box = await getBoundingBox(header);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
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
