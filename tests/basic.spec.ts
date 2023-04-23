import './utils/declare-test-window.js';

import { expect } from '@playwright/test';

import {
  addFrameByClick,
  captureHistory,
  disconnectByClick,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  getCurrentEditorTheme,
  getCurrentHTMLTheme,
  initEmptyParagraphState,
  pressArrowLeft,
  pressBackspace,
  pressEnter,
  redoByClick,
  redoByKeyboard,
  SHORT_KEY,
  switchReadonly,
  toggleDarkMode,
  type,
  undoByClick,
  undoByKeyboard,
  waitDefaultPageLoaded,
  waitForPageReady,
  waitForRemoteUpdateSlot,
  waitNextFrame,
} from './utils/actions/index.js';
import {
  assertBlockChildrenIds,
  assertEmpty,
  assertRichTexts,
  assertStore,
  assertStoreMatchJSX,
  assertText,
  assertTitle,
  defaultStore,
} from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('basic input', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');

  await test.expect(page).toHaveTitle(/BlockSuite/);
  await assertStore(page, defaultStore);
  await assertText(page, 'hello');
});

test('basic init with external text', async ({ page }) => {
  await enterPlaygroundRoom(page);

  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlock('affine:page', {
      title: new page.Text('hello'),
    });
    const frame = page.addBlock('affine:frame', {}, pageId);

    const text = new page.Text('world');
    page.addBlock('affine:paragraph', { text }, frame);

    const delta = [
      { insert: 'foo ' },
      { insert: 'bar', attributes: { bold: true } },
    ];
    page.addBlock(
      'affine:paragraph',
      {
        text: page.Text.fromDelta(delta),
      },
      frame
    );
  });

  await assertTitle(page, 'hello');
  await assertRichTexts(page, ['world', 'foo bar']);
});

test('basic multi user state', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  await initEmptyParagraphState(pageA);
  await waitNextFrame(pageA);
  await waitDefaultPageLoaded(pageA);
  await focusTitle(pageA);
  await type(pageA, 'hello');

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, {}, room, undefined, true);
  await waitDefaultPageLoaded(pageB);
  await focusTitle(pageB);
  await assertTitle(pageB, 'hello');

  await type(pageB, ' world');
  await assertTitle(pageA, 'hello world');
});

test('A open and edit, then joins B', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  await initEmptyParagraphState(pageA);
  await waitNextFrame(pageA);
  await focusRichText(pageA);
  await type(pageA, 'hello');

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, {}, room, undefined, true);

  // wait until pageB content updated
  await assertText(pageB, 'hello');
  await Promise.all([
    assertText(pageA, 'hello'),
    assertStore(pageA, defaultStore),
    assertStore(pageB, defaultStore),
    assertBlockChildrenIds(pageA, '0', ['1']),
    assertBlockChildrenIds(pageB, '0', ['1']),
  ]);
});

test('A first open, B first edit', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  await initEmptyParagraphState(pageA);
  await waitNextFrame(pageA);
  await focusRichText(pageA);

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, {}, room, undefined, true);
  await focusRichText(pageB);

  const slot = waitForRemoteUpdateSlot(pageA);
  await type(pageB, 'hello');
  await slot;
  // wait until pageA content updated
  await assertText(pageA, 'hello');
  await assertText(pageB, 'hello');
  await Promise.all([
    assertStore(pageA, defaultStore),
    assertStore(pageB, defaultStore),
  ]);
});

test('does not sync when disconnected', async ({ browser, page: pageA }) => {
  test.fail();

  const room = await enterPlaygroundRoom(pageA);
  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, {}, room);

  await disconnectByClick(pageA);
  await disconnectByClick(pageB);

  // click together, both init with default id should lead to conflicts
  await initEmptyParagraphState(pageA);
  await initEmptyParagraphState(pageB);

  await waitNextFrame(pageA);
  await focusRichText(pageA);
  await waitNextFrame(pageB);
  await focusRichText(pageB);
  await waitNextFrame(pageA);

  await type(pageA, '');
  await waitNextFrame(pageB);
  await type(pageB, '');
  await waitNextFrame(pageA);
  await type(pageA, 'hello');
  await waitNextFrame(pageB);

  await assertText(pageB, 'hello');
  await assertText(pageA, 'hello'); // actually '\n'
});

test('basic paired undo/redo', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');

  await assertText(page, 'hello');
  await undoByKeyboard(page);
  await assertEmpty(page);
  await redoByKeyboard(page);
  await assertText(page, 'hello');

  await undoByKeyboard(page);
  await assertEmpty(page);
  await redoByKeyboard(page);
  await assertText(page, 'hello');
});

test('undo/redo with keyboard', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');

  await assertText(page, 'hello');
  await undoByKeyboard(page);
  await assertEmpty(page);
  await redoByClick(page);
  await assertText(page, 'hello');
});

test('undo after adding block twice', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);
  await redoByKeyboard(page);
  await assertRichTexts(page, ['hello', 'world']);
});

test('should readonly mode not be able to modify text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { paragraphId } = await initEmptyParagraphState(page);

  await focusRichText(page);
  await type(page, 'hello');
  await switchReadonly(page);

  await dragBetweenIndices(page, [0, 1], [0, 3]);
  await page.keyboard.press(`${SHORT_KEY}+b`);
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text="hello"
  prop:type="text"
/>`,
    paragraphId
  );

  await undoByKeyboard(page);
  await assertStoreMatchJSX(
    page,
    `
<affine:paragraph
  prop:text="hello"
  prop:type="text"
/>`,
    paragraphId
  );
});

test('undo/redo twice after adding block twice', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await assertRichTexts(page, ['hello', 'world']);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['']);

  await redoByClick(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['hello', 'world']);
});

test('should undo/redo works on title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitNextFrame(page);

  await focusTitle(page);
  await type(page, 'title');
  await focusRichText(page);
  await type(page, 'hello world');
  await captureHistory(page);
  let i = 5;
  while (i--) {
    await pressBackspace(page);
  }

  await focusTitle(page);
  await captureHistory(page);
  await type(page, ' something');
  await undoByKeyboard(page);
  await assertTitle(page, 'title');
  await assertRichTexts(page, ['hello ']);

  await focusRichText(page);
  await undoByKeyboard(page);
  await assertTitle(page, 'title');
  await assertRichTexts(page, ['hello world']);

  await focusTitle(page);
  await redoByKeyboard(page);
  await assertTitle(page, 'title');
  await assertRichTexts(page, ['hello ']);

  await focusTitle(page);
  await redoByKeyboard(page);
  await assertTitle(page, 'title something');
  await assertRichTexts(page, ['hello ']);
});

test('should undo/redo cursor works on title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await waitNextFrame(page);

  await focusTitle(page);
  await type(page, 'title');
  await focusRichText(page);
  await type(page, 'hello');
  await captureHistory(page);

  await assertTitle(page, 'title');
  await assertRichTexts(page, ['hello']);

  await focusTitle(page);
  await type(page, '1');
  await focusRichText(page);
  await undoByKeyboard(page);
  await waitNextFrame(page);
  await type(page, '2');
  await assertTitle(page, 'title2');
  await assertRichTexts(page, ['hello']);

  await type(page, '3');
  await focusRichText(page);
  await waitNextFrame(page);
  await undoByKeyboard(page);
  await redoByKeyboard(page);
  await waitNextFrame(page);
  await type(page, '4');
  await assertTitle(page, 'title23');
  await assertRichTexts(page, ['hello4']);
});

test('undo multi frames', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await addFrameByClick(page);
  await assertRichTexts(page, ['', '']);

  await undoByClick(page);
  await assertRichTexts(page, ['']);

  await redoByClick(page);
  await assertRichTexts(page, ['', '']);
});

test('change theme', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  const currentTheme = await getCurrentHTMLTheme(page);
  await toggleDarkMode(page);
  const expectNextTheme = currentTheme === 'light' ? 'dark' : 'light';
  const nextHTMLTheme = await getCurrentHTMLTheme(page);
  expect(nextHTMLTheme).toBe(expectNextTheme);

  const nextEditorTheme = await getCurrentEditorTheme(page);
  expect(nextEditorTheme).toBe(expectNextTheme);
});

test('should be able to delete an emoji completely by pressing backspace once', async ({
  page,
}) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2138',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '🌷🙅‍♂️🏳️‍🌈');
  await pressBackspace(page);
  await pressBackspace(page);
  await pressBackspace(page);
  await assertText(page, '');
});

test('delete emoji in the middle of the text', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2138',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '1🌷1🙅‍♂️1🏳️‍🌈1👨‍👩‍👧‍👦1');
  await pressArrowLeft(page, 1);
  await pressBackspace(page);
  await pressArrowLeft(page, 1);
  await pressBackspace(page);
  await pressArrowLeft(page, 1);
  await pressBackspace(page);
  await pressArrowLeft(page, 1);
  await pressBackspace(page);
  await assertText(page, '11111');
});

test('ZERO_WIDTH_SPACE should be counted by one cursor position', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.waitForTimeout(100);
  await page.keyboard.press(`Shift+Enter`, { delay: 50 });
  await type(page, 'asdfg');
  await page.waitForTimeout(100);
  await pressEnter(page);
  await page.waitForTimeout(100);
  await undoByKeyboard(page);
  await pressBackspace(page);
  const line = page.locator('v-line').last();
  expect(await line.innerText()).toBe('asdf');
});
