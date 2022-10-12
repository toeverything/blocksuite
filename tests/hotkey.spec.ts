import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  blurRichText,
  selectAllByKeyboard,
  inlineCode,
  undoByClick,
  redoByClick,
<<<<<<< HEAD
  strikethrough,
  undoByKeyboard,
  redoByKeyboard,
=======
  addGroupByClick,
  pressCtrlA,
>>>>>>> origin
} from './utils/actions';
import {
  assertSelection,
  assertSelectedBlockCount,
<<<<<<< HEAD
  assertTextFormat,
=======
  assertInlineCode,
>>>>>>> origin
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

test('rich-text code-inline hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('helloWorld');
  await selectAllByKeyboard(page);
  await inlineCode(page);
  await assertTextFormat(page, { code: true });

  //undo
  await undoByKeyboard(page);
  await assertTextFormat(page, {});
  //redo
  await redoByKeyboard(page);
  await assertTextFormat(page, { code: true });

  await inlineCode(page);
  await assertTextFormat(page, {});
});

test('rich-text strikethrough hotkey ', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('helloWorld');
  await selectAllByKeyboard(page);
  await strikethrough(page);
  await assertTextFormat(page, { strike: true });

  //undo
  await undoByClick(page);
  await assertTextFormat(page, {});
  //redo
  await redoByClick(page);
  await assertTextFormat(page, { strike: true });
  // twice
  await strikethrough(page);
  await assertTextFormat(page, {});
});
