/* eslint-disable @typescript-eslint/no-non-null-assertion */
import './utils/declare-test-window';
import { test } from '@playwright/test';
import type { Space } from '../packages/store';
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
  addGroupByClick,
  initEmptyState,
} from './utils/actions';
import {
  defaultStore,
  assertBlockChildrenIds,
  assertEmpty,
  assertStore,
  assertText,
  assertRichTexts,
  assertTitle,
} from './utils/asserts';

test('basic input', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

  await test.expect(page).toHaveTitle(/BlockSuite/);
  await assertStore(page, defaultStore);
  await assertText(page, 'hello');
});

test('basic init with external text', async ({ page }) => {
  await enterPlaygroundRoom(page);

  await page.evaluate(() => {
    const space = window.store.space as Space;

    const pageId = space.addBlock({ flavour: 'affine:page', title: 'hello' });
    const groupId = space.addBlock({ flavour: 'affine:group' }, pageId);

    const text = new space.Text(space, 'world');
    space.addBlock({ flavour: 'affine:paragraph', text }, groupId);

    const delta = [
      { insert: 'foo ' },
      { insert: 'bar', attributes: { bold: true } },
    ];
    space.addBlock(
      { flavour: 'affine:paragraph', text: space.Text.fromDelta(space, delta) },
      groupId
    );
  });

  await assertTitle(page, 'hello');
  await assertRichTexts(page, ['world', 'foo bar']);
});

test('basic multi user state', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  await pageA.keyboard.type('hello');

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, room);
  await waitDefaultPageLoaded(pageB);
  await assertTitle(pageB, 'hello');

  await pageB.keyboard.type(' world');
  await assertTitle(pageA, 'hello world');
});

test('A open and edit, then joins B', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  await initEmptyState(pageA);
  await focusRichText(pageA);
  await pageA.keyboard.type('hello');

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, room);

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
  // await focusFirstTextBlock(pageA); // do not init (add blocks) in A

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, room);
  await initEmptyState(pageB);
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
  await enterPlaygroundRoom(pageB, room);

  await disconnectByClick(pageA);
  await disconnectByClick(pageB);

  // click together, both init with default id should lead to conflicts
  await initEmptyState(pageA);
  await initEmptyState(pageB);
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
  await initEmptyState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');

  await assertText(page, 'hello');
  await undoByClick(page);
  await assertEmpty(page);
  await redoByClick(page);
  await assertText(page, 'hello');

  await undoByClick(page);
  await assertEmpty(page);
  await redoByKeyboard(page);
  await assertText(page, 'hello');
});

test('undo/redo with keyboard', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
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
  await initEmptyState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  await page.keyboard.type('world');

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);
  await redoByKeyboard(page);
  await assertRichTexts(page, ['hello', 'world']);
});

test('undo/redo twice after adding block twice', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['hello', 'world']);

  await undoByKeyboard(page);
  await assertRichTexts(page, ['hello']);

  await undoByKeyboard(page);
  await assertRichTexts(page, []);

  await redoByClick(page);
  await assertRichTexts(page, ['hello']);

  await redoByKeyboard(page);
  await assertRichTexts(page, ['hello', 'world']);
});

test('undo multi groups', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyState(page);
  await focusRichText(page);
  await addGroupByClick(page);
  await assertRichTexts(page, ['\n', '\n']);

  await undoByClick(page);
  await assertRichTexts(page, ['\n']);

  await redoByClick(page);
  await assertRichTexts(page, ['\n', '\n']);
});
