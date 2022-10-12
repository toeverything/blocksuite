import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  blurRichText,
  selectAllByKeyboard,
  inlineCode,
  undoByClick,
  redoByClick,
  addGroupByClick,
  pressCtrlA,
} from './utils/actions';
import {
  assertSelection,
  assertSelectedBlockCount,
  assertInlineCode,
} from './utils/asserts';

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

test('rich-text code-inline hotkey scope', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('helloWorld');
  await selectAllByKeyboard(page);
  await inlineCode(page);
  await assertInlineCode(page, true);

  //undo
  await undoByClick(page);
  await assertInlineCode(page, false);
  //redo
  await redoByClick(page);
  await assertInlineCode(page, true);

  await inlineCode(page);
  await assertInlineCode(page, false);
});

test('select all block by hot key', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await addGroupByClick(page);
  await addGroupByClick(page);
  await focusRichText(page);
  // IMP: not stable
  await page.click('body', {
    position: { x: 70, y: 0 },
  });
  await pressCtrlA(page);
  await assertSelectedBlockCount(page, 3);
});
