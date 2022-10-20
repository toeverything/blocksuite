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
  initThreeParagraphs,
  dragBetweenIndices,
} from './utils/actions';
import {
  assertRichTexts,
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
  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['\n']);
});

test('single line rich-text inline code hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await selectAllByKeyboard(page);
  await inlineCode(page);
  await assertTextFormat(page, 0, 0, { code: true });

  // undo
  await undoByKeyboard(page);
  await assertTextFormat(page, 0, 0, {});
  // redo
  await redoByKeyboard(page);
  await assertTextFormat(page, 0, 0, { code: true });

  await inlineCode(page);
  await assertTextFormat(page, 0, 0, {});
});

test('multi line rich-text inline code hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initThreeParagraphs(page);
  await assertRichTexts(page, ['123', '456', '789']);

  // 0    1   2
  // 1|23 456 78|9
  await dragBetweenIndices(page, [0, 1], [2, 2]);
  await inlineCode(page);

  // split at 0,1
  await assertTextFormat(page, 0, 1, {});
  await assertTextFormat(page, 0, 2, { code: true });

  // split at 2,2
  await assertTextFormat(page, 2, 2, { code: true });
  await assertTextFormat(page, 2, 3, {});

  await undoByClick(page);
  await assertTextFormat(page, 0, 1, {});
  await assertTextFormat(page, 0, 2, {});
  await assertTextFormat(page, 2, 2, {});
  await assertTextFormat(page, 2, 3, {});

  await redoByClick(page);
  await assertTextFormat(page, 0, 1, {});
  await assertTextFormat(page, 0, 2, { code: true });
  await assertTextFormat(page, 2, 2, { code: true });
  await assertTextFormat(page, 2, 3, {});
});

test('single line rich-text strikethrough hotkey', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await selectAllByKeyboard(page);
  await strikethrough(page);
  await assertTextFormat(page, 0, 0, { strike: true });

  await undoByClick(page);
  await assertTextFormat(page, 0, 0, {});

  await redoByClick(page);
  await assertTextFormat(page, 0, 0, { strike: true });

  // trigger hotkey twice
  await strikethrough(page);
  await assertTextFormat(page, 0, 0, {});
});
