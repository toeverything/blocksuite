import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  selectAllByKeyboard,
  inlineCode,
  undoByClick,
  redoByClick,
  strikethrough,
  undoByKeyboard,
  redoByKeyboard,
  pressEnter,
} from './utils/actions';
import {
  assertRichTexts,
  assertSelection,
  assertTextFormat,
} from './utils/asserts';

test('rich-text hotkey scope on single press', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['hello', 'world']);

  await selectAllByKeyboard(page); // first select all in rich text
  await assertSelection(page, 1, 0, 5);

  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['hello', '\n']);
});

test('rich-text code-inline hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await selectAllByKeyboard(page);
  await inlineCode(page);
  await assertTextFormat(page, { code: true });

  // undo
  await undoByKeyboard(page);
  await assertTextFormat(page, {});
  // redo
  await redoByKeyboard(page);
  await assertTextFormat(page, { code: true });

  await inlineCode(page);
  await assertTextFormat(page, {});
});

test('rich-text strikethrough hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await selectAllByKeyboard(page);
  await strikethrough(page);
  await assertTextFormat(page, { strike: true });

  // undo
  await undoByClick(page);
  await assertTextFormat(page, {});
  // redo
  await redoByClick(page);
  await assertTextFormat(page, { strike: true });
  // twice
  await strikethrough(page);
  await assertTextFormat(page, {});
});
