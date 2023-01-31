import './utils/declare-test-window.js';
import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  disconnectByClick,
  redoByClick,
  redoByKeyboard,
  undoByClick,
  undoByKeyboard,
  focusRichText,
  waitDefaultPageLoaded,
  pressEnter,
  addFrameByClick,
  initEmptyParagraphState,
  dragBetweenIndices,
  SHORT_KEY,
  captureHistory,
  focusTitle,
  switchReadonly,
} from './utils/actions/index.js';
import {
  defaultStore,
  assertBlockChildrenIds,
  assertEmpty,
  assertStore,
  assertText,
  assertRichTexts,
  assertTitle,
  assertStoreMatchJSX,
} from './utils/asserts.js';

test('basic input', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

  await test.expect(page).toHaveTitle(/BlockSuite/);
  await assertStore(page, defaultStore);
  await assertText(page, 'hello');
});

test('basic init with external text', async ({ page }) => {
  await enterPlaygroundRoom(page);

  await page.evaluate(() => {
    const { page } = window;
    const pageId = page.addBlockByFlavour('affine:page', { title: 'hello' });
    const frame = page.addBlockByFlavour('affine:frame', {}, pageId);

    const text = new page.Text(page, 'world');
    page.addBlockByFlavour('affine:paragraph', { text }, frame);

    const delta = [
      { insert: 'foo ' },
      { insert: 'bar', attributes: { bold: true } },
    ];
    page.addBlock(
      {
        flavour: 'affine:paragraph',
        text: page.Text.fromDelta(page, delta),
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
  await pageA.keyboard.type('hello');

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, {}, room);
  await waitDefaultPageLoaded(pageB);
  await assertTitle(pageB, 'hello');

  await pageB.keyboard.type(' world');
  await assertTitle(pageA, 'hello world');
});

test('A open and edit, then joins B', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  await initEmptyParagraphState(pageA);
  await focusRichText(pageA);
  await pageA.keyboard.type('hello');

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, {}, room);

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
  await focusRichText(pageA);

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, {}, room);
  await focusRichText(pageB);
  await pageB.keyboard.type('hello');

  // wait until pageA content updated
  await assertText(pageA, 'hello');
  await Promise.all([
    assertText(pageB, 'hello'),
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
  await focusRichText(pageA);
  await focusRichText(pageB);
  await pageA.keyboard.type('');
  await pageB.keyboard.type('');

  await pageA.keyboard.type('hello');

  await assertText(pageB, 'hello');
  await assertText(pageA, 'hello'); // actually '\n'
});

test('basic paired undo/redo', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

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
  await page.keyboard.type('hello');

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
  await page.keyboard.type('hello');
  await pressEnter(page);
  await page.keyboard.type('world');

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);
  await redoByKeyboard(page);
  await assertRichTexts(page, ['hello', 'world']);
});

test('should readonly mode not be able to modify text', async ({ page }) => {
  await enterPlaygroundRoom(page);
  const { paragraphId } = await initEmptyParagraphState(page);

  await focusRichText(page);
  await page.keyboard.type('hello');
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
  await page.keyboard.type('hello');
  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['hello', 'world']);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['\n']);

  await redoByClick(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['hello', 'world']);
});

test('should undo/redo work on title', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusTitle(page);
  await page.keyboard.type('title');
  await focusRichText(page);
  await page.keyboard.type('hello world');
  await captureHistory(page);
  let i = 5;
  while (i--) {
    await page.keyboard.press('Backspace');
  }

  await focusTitle(page);
  await captureHistory(page);
  await page.keyboard.type(' something');
  await undoByKeyboard(page);
  await assertTitle(page, 'title');
  await assertRichTexts(page, ['hello ']);

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

test.skip('undo multi frames', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await addFrameByClick(page);
  await assertRichTexts(page, ['\n', '\n']);

  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await redoByClick(page);
  await assertRichTexts(page, ['\n', '\n']);
});
