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
  assertStoreMatchJSX,
} from './utils/asserts.js';
import {
  clickBlockTypeMenuButton,
  enterPlaygroundRoom,
  focusRichText,
  pressEnter,
  redoByKeyboard,
  pressShiftEnter,
  pressShiftTab,
  undoByClick,
  undoByKeyboard,
  initEmptyParagraphState,
  dragOverTitle,
  resetHistory,
} from './utils/actions/index.js';

test('init paragraph by page title enter at last', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  await page.keyboard.type('world');

  await assertTitle(page, 'hello');
  await assertRichTexts(page, ['world', '\n']);
});

test('init paragraph by page title enter in middle', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
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

// https://github.com/toeverything/blocksuite/issues/364
test('paragraph with child block should work at enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { groupId } = await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('123');
  await pressEnter(page);
  await page.keyboard.type('456');

  await focusRichText(page, 1);
  await page.keyboard.press('Tab');
  await assertStoreMatchJSX(
    page,
    `
<affine:group
  prop:xywh="[0,0,720,72]"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    />
  </affine:paragraph>
</affine:group>`,
    groupId
  );
  await focusRichText(page, 0);
  await pressEnter(page);
  await page.keyboard.type('789');
  await assertStoreMatchJSX(
    page,
    `
<affine:group
  prop:xywh="[0,0,720,112]"
>
  <affine:paragraph
    prop:text="123"
    prop:type="text"
  >
    <affine:paragraph
      prop:text="789"
      prop:type="text"
    />
    <affine:paragraph
      prop:text="456"
      prop:type="text"
    />
  </affine:paragraph>
</affine:group>`,
    groupId
  );
});

test('switch between paragraph types', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

  const selector = '.affine-paragraph-block-container';

  await clickBlockTypeMenuButton(page, 'H1');
  await assertClassName(page, selector, /h1/);

  await clickBlockTypeMenuButton(page, 'H2');
  await assertClassName(page, selector, /h2/);

  await clickBlockTypeMenuButton(page, 'H3');
  await assertClassName(page, selector, /h3/);

  await undoByClick(page);
  await assertClassName(page, selector, /h2/);

  await undoByClick(page);
  await assertClassName(page, selector, /h1/);
});

test('delete at start of paragraph block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

  await pressEnter(page);
  await page.keyboard.type('a');

  await clickBlockTypeMenuButton(page, 'H1');
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

test('delete at start of paragraph immediately following list', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

  await pressEnter(page);
  await page.keyboard.type('a');

  await clickBlockTypeMenuButton(page, 'Bulleted List');
  await focusRichText(page, 1);
  await assertBlockType(page, '2', 'text');
  await assertBlockType(page, '4', 'bulleted');

  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await assertBlockType(page, '5', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '5']);

  await page.keyboard.press('Backspace');
  await assertBlockChildrenIds(page, '1', ['2']);

  await undoByClick(page);
  await undoByClick(page);
  await clickBlockTypeMenuButton(page, 'Numbered List');
  await focusRichText(page, 1);
  await assertBlockType(page, '2', 'text');
  await assertBlockType(page, '4', 'numbered');

  await page.keyboard.press('Backspace');
  await assertBlockType(page, '6', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '6']);

  await page.keyboard.press('Backspace');
  await assertBlockChildrenIds(page, '1', ['2']);

  await undoByClick(page);
  await undoByClick(page);
  await clickBlockTypeMenuButton(page, 'Todo List');
  await focusRichText(page, 1);
  await assertBlockType(page, '2', 'text');
  await assertBlockType(page, '4', 'todo');

  await page.keyboard.press('Backspace');
  await assertBlockType(page, '7', 'text');
  await assertBlockChildrenIds(page, '1', ['2', '7']);

  await page.keyboard.press('Backspace');
  await assertBlockChildrenIds(page, '1', ['2']);
});

test('delete at start of paragraph with content', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
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
  await initEmptyParagraphState(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n']);

  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['world', '\n']);
});

test('handling keyup when cursor located in first paragraph', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n']);

  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['world', '\n']);
  await page.keyboard.press('ArrowUp', { delay: 50 });
  await assertPageTitleFocus(page);
});

test('after deleting a text row, cursor should jump to the end of previous list row', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await assertSelection(page, 0, 5, 0);

  await pressEnter(page);
  await page.keyboard.type('w');
  await assertRichTexts(page, ['hello', 'w']);
  await assertSelection(page, 1, 1, 0);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowDown');

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Backspace');
  await assertSelection(page, 0, 5, 0);
});
