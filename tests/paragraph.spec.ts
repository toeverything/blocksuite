import { test } from '@playwright/test';
import {
  assertSelection,
  assertRichTexts,
  assertBlockChildrenFlavours,
  assertBlockChildrenIds,
} from './utils/asserts';
import {
  enterPlaygroundRoom,
  focusRichText,
  pressEnter,
  redoByKeyboard,
  shiftTab,
  undoByKeyboard,
} from './utils/actions';

test('append new text block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await assertSelection(page, 0, 5, 0);

  await pressEnter(page);
  await assertRichTexts(page, ['hello', '\n']);
  await assertSelection(page, 1, 0, 0);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);
  await assertSelection(page, 0, 5, 0);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['hello', '\n']);
  await assertSelection(page, 1, 0, 0);
});

test('insert new text block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await pressEnter(page);
  await pressEnter(page);
  await assertRichTexts(page, ['\n', '\n', '\n']);

  await focusRichText(page, 1);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n', 'hello', '\n']);

  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['\n', 'hello', 'world', '\n']);
  await assertBlockChildrenFlavours(page, '0', [
    'paragraph',
    'paragraph',
    'paragraph',
    'paragraph',
  ]);
});

test('indent and unindent existing text block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

  await pressEnter(page);
  await focusRichText(page, 1);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['hello', 'world']);

  // indent
  await page.keyboard.press('Tab');
  await assertRichTexts(page, ['hello', 'world']);
  await assertBlockChildrenIds(page, '0', ['1']);
  await assertBlockChildrenIds(page, '1', ['2']);

  // unindent
  await shiftTab(page);
  await assertRichTexts(page, ['hello', 'world']);
  await assertBlockChildrenIds(page, '0', ['1', '2']);

  await undoByKeyboard(page);
  await assertBlockChildrenIds(page, '0', ['1']);

  await redoByKeyboard(page);
  await assertBlockChildrenIds(page, '0', ['1', '2']);
});
