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
  blurRichText,
} from './utils/actions';
import {
  assertSelection,
  assertTextFormat,
  assertBlockCount,
} from './utils/asserts';

test('rich-text hotkey scope on single press', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await selectAllByKeyboard(page); // first select all in rich text
  await assertSelection(page, 0, 0, 5);
});

test.skip('rich-text hotkey scope on double press', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await selectAllByKeyboard(page); // first select all in rich text
  await assertSelection(page, 0, 0, 5);

  await blurRichText(page);
  await selectAllByKeyboard(page); // second select in page scope
  // await assertSelectedBlockCount(page, 1);

  await focusRichText(page);
  await selectAllByKeyboard(page); // first select all in rich text
  await assertSelection(page, 0, 0, 5);

  await selectAllByKeyboard(page); // second select all in rich text
  // await assertSelectedBlockCount(page, 1);
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

test('rich-text strikethrough hotkey', async ({ page }) => {
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

test.skip('delete before select-all in page', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('helloWorld');
  await selectAllByKeyboard(page);
  // second select all in rich text
  await selectAllByKeyboard(page);
  await assertBlockCount(page, 'group', 1);
  await page.keyboard.press('Backspace');
  await assertBlockCount(page, 'group', 0);
  await undoByClick(page);
  await redoByClick(page);
  await assertBlockCount(page, 'group', 0);
});
