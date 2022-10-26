import { test, expect } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyState,
  pressEnter,
  redoByClick,
  switchMode,
  undoByClick,
  waitNextFrame,
} from './utils/actions';
import {
  assertNativeSelectionRangeCount,
  assertRichTexts,
  assertSelection,
} from './utils/asserts';

test('switch to edgeless mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);
  await assertSelection(page, 0, 5, 0);

  await switchMode(page);
  const locator = page.locator('.affine-edgeless-page-block-container');
  await expect(locator).toHaveCount(1);
  await assertRichTexts(page, ['hello']);

  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 0);
});

test('cursor for active and inactive state', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  await pressEnter(page);
  await assertRichTexts(page, ['hello', '\n', '\n']);

  // inactive
  await switchMode(page);
  await undoByClick(page);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 0);

  await redoByClick(page);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 0);

  // active
  await page.mouse.dblclick(450, 300);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 1);

  await undoByClick(page);
  await waitNextFrame(page);
  await assertNativeSelectionRangeCount(page, 1);
});
