import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  blurRichText,
  selectAllByKeyboard,
  addGroupByClick,
  pressCtrlA,
} from './utils/actions';
import { assertSelection, assertSelectedBlockCount } from './utils/asserts';

test('rich-text hotkey scope', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await selectAllByKeyboard(page); // first select all
  await assertSelection(page, 0, 0, 5);

  await blurRichText(page);
  await selectAllByKeyboard(page); // second select all
  await assertSelectedBlockCount(page, 1);
});

test.only('select all block by hot key', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await addGroupByClick(page);
  await addGroupByClick(page);
  await focusRichText(page);
  // IMP: not stable
  await page.click('body', {
    position: { x: 70, y: 0 },
  });
  await pressCtrlA(page);
  assertSelectedBlockCount(page, 3);
});
