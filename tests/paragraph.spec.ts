import { test } from '@playwright/test';
import {
  assertSelection,
  assertRichTexts,
  assertBlockChildrenFlavours,
  assertBlockChildrenIds,
  assertClassName,
  assertBlockType,
  assertTitle,
} from './utils/asserts';
import {
  clickMenuButton,
  enterPlaygroundRoom,
  focusRichText,
  pressEnter,
  redoByKeyboard,
  shiftEnter,
  shiftTab,
  undoByClick,
  undoByKeyboard,
} from './utils/actions';

test('init paragraph by page title enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  await page.keyboard.type('world');
  await assertTitle(page, 'hello');
  await assertRichTexts(page, ['world']);
});

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
  await assertBlockChildrenFlavours(page, '1', [
    'paragraph',
    'paragraph',
    'paragraph',
    'paragraph',
  ]);
});

test('split paragraph block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await assertSelection(page, 0, 2, 0);

  await pressEnter(page);
  await assertRichTexts(page, ['he', 'llo']);
  await assertBlockChildrenFlavours(page, '1', ['paragraph', 'paragraph']);
  await assertSelection(page, 1, 0, 0);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he', 'llo']);
});

test('add multi line by soft enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await assertSelection(page, 0, 2, 0);

  await shiftEnter(page);
  await assertRichTexts(page, ['he\n\nllo']);
  await assertSelection(page, 0, 3, 0);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he\n\nllo']);
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
  await assertBlockChildrenIds(page, '1', ['2']);
  await assertBlockChildrenIds(page, '2', ['3']);

  // unindent
  await shiftTab(page);
  await assertRichTexts(page, ['hello', 'world']);
  await assertBlockChildrenIds(page, '1', ['2', '3']);

  await undoByKeyboard(page);
  await assertBlockChildrenIds(page, '1', ['2']);

  await redoByKeyboard(page);
  await assertBlockChildrenIds(page, '1', ['2', '3']);
});

test('switch between paragraph types', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

  const selector = '.affine-paragraph-block-container';

  await clickMenuButton(page, 'heading-1');
  await assertClassName(page, selector, /h1/);

  await clickMenuButton(page, 'heading-2');
  await assertClassName(page, selector, /h2/);

  await clickMenuButton(page, 'heading-3');
  await assertClassName(page, selector, /h3/);

  await undoByClick(page);
  await assertClassName(page, selector, /h2/);

  await undoByClick(page);
  await assertClassName(page, selector, /h1/);
});

test('delete at start of paragraph block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

  await pressEnter(page);
  await page.keyboard.type('a');

  await clickMenuButton(page, 'heading-1');
  await focusRichText(page, 1);
  await assertBlockType(page, '2', 'text');
  await assertBlockType(page, '3', 'h1');

  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await assertBlockType(page, '3', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '3']);

  await page.keyboard.press('Backspace');
  await assertBlockChildrenIds(page, '1', ['2']);

  await undoByClick(page);
  await assertBlockChildrenIds(page, '1', ['2', '3']);
});

test('delete at start of paragraph with content', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('123');

  await pressEnter(page);
  await page.keyboard.type('456');
  await assertRichTexts(page, ['123', '456']);

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await assertSelection(page, 1, 0, 0);

  await page.keyboard.press('Backspace');
  await assertRichTexts(page, ['123456']);

  await undoByClick(page);
  await assertRichTexts(page, ['123', '456']);
});

test('get focus from page title enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n']);

  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['world']);
});
