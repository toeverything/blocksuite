import { test } from '@playwright/test';
import {
  assertSelection,
  assertRichTexts,
  assertBlockChildrenFlavours,
  assertBlockChildrenIds,
  assertClassname,
} from './utils/asserts';
import {
  clickMenuButton,
  enterPlaygroundRoom,
  focusRichText,
  pressEnter,
  redoByKeyboard,
  shiftTab,
  undoByClick,
  undoByKeyboard,
} from './utils/actions';

test('append new paragraph block by enter', async ({ page }) => {
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

test('insert new paragraph block by enter', async ({ page }) => {
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

test('indent and unindent existing paragraph block', async ({ page }) => {
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

test('switch between paragraph types', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

  const selector = '.affine-rich-text.quill-container';

  await clickMenuButton(page, 'heading-1');
  await assertClassname(page, selector, /h1/);

  await clickMenuButton(page, 'heading-2');
  await assertClassname(page, selector, /h2/);

  await clickMenuButton(page, 'heading-3');
  await assertClassname(page, selector, /h3/);

  await undoByClick(page);
  await assertClassname(page, selector, /h2/);

  await undoByClick(page);
  await assertClassname(page, selector, /h1/);
});
