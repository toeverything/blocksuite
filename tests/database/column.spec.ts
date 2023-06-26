import { expect } from '@playwright/test';

import {
  dragBetweenCoords,
  enterPlaygroundRoom,
  getBoundingBox,
  initDatabaseDynamicRowWithData,
  initEmptyDatabaseState,
  pressEnter,
  pressEscape,
  selectAllByKeyboard,
  type,
  undoByClick,
  waitNextFrame,
} from '../utils/actions/index.js';
import { test } from '../utils/playwright.js';
import {
  assertDatabaseCellLink,
  assertDatabaseCellNumber,
  assertDatabaseCellRichTexts,
  assertSelectedStyle,
  clickDatabaseOutside,
  getFirstColumnCell,
  initDatabaseColumn,
  performSelectColumnTagAction,
  switchColumnType,
} from './actions.js';

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

  test('switch to link', async ({ page }) => {
    await enterPlaygroundRoom(page);
    await initEmptyDatabaseState(page);

    await initDatabaseColumn(page);
    await initDatabaseDynamicRowWithData(page, '', true);
    await switchColumnType(page, 'link');

    const linkText = 'http://';
    const cell = getFirstColumnCell(page, 'affine-database-link');
    await initDatabaseDynamicRowWithData(page, linkText);
    const link = cell.locator('affine-link > a');
    await expect(link).toHaveAttribute('href', linkText);
    await assertDatabaseCellLink(page, { text: linkText });

    // Hover link
    const linkPopoverLocator = page.locator('.affine-link-popover');
    await expect(linkPopoverLocator).not.toBeVisible();
    await link.hover();
    // wait for popover delay open
    await page.waitForTimeout(200);
    await expect(linkPopoverLocator).not.toBeVisible();

    // not link text
    await cell.hover();
    const linkEdit = cell.locator('.affine-database-link-icon');
    await linkEdit.click();
    await selectAllByKeyboard(page);
    await type(page, 'abc');
    await pressEnter(page);
    await expect(link).toBeHidden();
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
