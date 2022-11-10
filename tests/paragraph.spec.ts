import { test } from '@playwright/test';
import {
  assertSelection,
  assertRichTexts,
  assertBlockChildrenFlavours,
  assertBlockChildrenIds,
  assertClassName,
  assertBlockType,
  assertTitle,
  assertPageTitleFocus,
} from './utils/asserts';
import {
  clickMenuButton,
  enterPlaygroundRoom,
  focusRichText,
  pressEnter,
  redoByKeyboard,
  pressShiftEnter,
  pressShiftTab,
  undoByClick,
  undoByKeyboard,
  initEmptyState,
  dragOverTitle,
  resetHistory,
} from './utils/actions';

test('init paragraph by page title enter at last', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  await page.keyboard.type('world');

  await assertTitle(page, 'hello');
  await assertRichTexts(page, ['world', '\n']);
});

test('init paragraph by page title enter in middle', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await page.keyboard.type('hello');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await pressEnter(page);

  await assertTitle(page, 'he');
  await assertRichTexts(page, ['llo', '\n']);
});

test('drag over paragraph title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await page.keyboard.type('hello');
  await assertTitle(page, 'hello');
  await resetHistory(page);

  await dragOverTitle(page);
  await page.keyboard.press('Backspace', { delay: 100 });
  await assertTitle(page, '');

  await undoByKeyboard(page);
  await assertTitle(page, 'hello');
});

test('backspace and arrow on title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await page.keyboard.type('hello');
  await assertTitle(page, 'hello');
  await resetHistory(page);

  await page.keyboard.press('Backspace', { delay: 50 });
  await assertTitle(page, 'hell');

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Backspace', { delay: 50 });
  await assertTitle(page, 'hll');

  await page.keyboard.press('ArrowDown');
  await assertSelection(page, 0, 0, 0);

  await undoByKeyboard(page);
  await assertTitle(page, 'hello');

  await redoByKeyboard(page);
  await assertTitle(page, 'hll');
});

test('append new paragraph block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
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
  await initEmptyState(page);
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
    'affine:paragraph',
    'affine:paragraph',
    'affine:paragraph',
    'affine:paragraph',
  ]);
});

test('split paragraph block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);

  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await assertSelection(page, 0, 2, 0);

  await pressEnter(page);
  await assertRichTexts(page, ['he', 'llo']);
  await assertBlockChildrenFlavours(page, '1', [
    'affine:paragraph',
    'affine:paragraph',
  ]);
  await assertSelection(page, 1, 0, 0);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he', 'llo']);
});

test('add multi line by soft enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);

  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await assertSelection(page, 0, 2, 0);

  await pressShiftEnter(page);
  await assertRichTexts(page, ['he\n\nllo']);
  await assertSelection(page, 0, 3, 0);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['he\n\nllo']);
});

test('indent and unindent existing paragraph block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
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
  await assertBlockChildrenIds(page, '2', ['4']);

  // unindent
  await pressShiftTab(page);
  await assertRichTexts(page, ['hello', 'world']);
  await assertBlockChildrenIds(page, '1', ['2', '5']);

  await undoByKeyboard(page);
  await assertBlockChildrenIds(page, '1', ['2']);

  await redoByKeyboard(page);
  await assertBlockChildrenIds(page, '1', ['2', '5']);
});

test('switch between paragraph types', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
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
  await initEmptyState(page);
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
  await initEmptyState(page);
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
  await initEmptyState(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n']);

  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['world', '\n']);
});

test('The key "Up" respond when the cursor located in first paragraph  ', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n']);

  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['world', '\n']);
  await page.keyboard.press('ArrowUp', { delay: 50 });
  await assertPageTitleFocus(page);
});
