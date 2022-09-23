import { test, expect } from '@playwright/test';
import type { SerializedStore } from '../packages/store';
import {
  enterPlaygroundRoom,
  disconnectByClick,
  connectByClick,
  redoByClick,
  redoByKeyboard,
  undoByClick,
  undoByKeyboard,
  focusFirstTextBlock,
} from './utils/actions';
import {
  assertBlockChildren,
  assertEmpty,
  assertStore,
  assertText,
  assertTextBlocks,
} from './utils/asserts';

const defaultStore: SerializedStore = {
  blocks: {
    '0': {
      'sys:id': '0',
      'sys:flavour': 'page',
      'sys:children': ['1'],
    },
    '1': {
      'sys:flavour': 'text',
      'sys:id': '1',
      'sys:children': [],
      'prop:text': 'hello',
    },
  },
};

test('basic input', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusFirstTextBlock(page);
  await page.keyboard.type('hello');

  await expect(page).toHaveTitle(/Building Blocks/);
  await assertStore(page, defaultStore);
  await assertText(page, 'hello');
});

test('basic multi user state', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  await focusFirstTextBlock(pageA);
  await pageA.keyboard.type('hello');

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, room);

  // wait until pageB content updated
  await assertText(pageB, 'hello');
  await Promise.all([
    assertText(pageA, 'hello'),
    assertStore(pageA, defaultStore),
    assertStore(pageB, defaultStore),
    assertBlockChildren(pageA, '0', ['1']),
    assertBlockChildren(pageB, '0', ['1']),
  ]);
});

test('A first open, B first edit', async ({ browser, page: pageA }) => {
  const room = await enterPlaygroundRoom(pageA);
  // await focusFirstTextBlock(pageA); // do not init (add blocks) in A

  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, room);
  await focusFirstTextBlock(pageB);
  await pageB.keyboard.type('hello');

  // wait until pageA content updated
  await assertText(pageA, 'hello');
  await Promise.all([
    assertText(pageB, 'hello'),
    assertStore(pageA, defaultStore),
    assertStore(pageB, defaultStore),
  ]);
});

test('conflict occurs as expected when two same id generated together', async ({
  browser,
  page: pageA,
}) => {
  test.fail();

  const room = await enterPlaygroundRoom(pageA);
  const pageB = await browser.newPage();
  await enterPlaygroundRoom(pageB, room);

  await disconnectByClick(pageA);
  await disconnectByClick(pageB);

  // click together, both init with default id leads to conflicts
  await focusFirstTextBlock(pageA);
  await focusFirstTextBlock(pageB);

  await connectByClick(pageA);
  await connectByClick(pageB);

  await pageA.keyboard.type('hello');

  await assertText(pageB, 'hello');
  await assertText(pageA, 'hello'); // actually '\n'
});

test('basic paired undo/redo', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusFirstTextBlock(page);
  await page.keyboard.type('hello');

  await assertText(page, 'hello');
  await undoByClick(page);
  await assertEmpty(page);
  await redoByClick(page);
  await assertText(page, 'hello');

  await undoByClick(page);
  await assertEmpty(page);
  await redoByClick(page);
  await assertText(page, 'hello');
});

test('undo/redo with keyboard', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusFirstTextBlock(page);
  await page.keyboard.type('hello');

  await assertText(page, 'hello');
  await undoByKeyboard(page);
  await assertEmpty(page);
  await redoByClick(page); // FIXME back to void state without quill, can't simply redo with quill handler
  await assertText(page, 'hello');
});

test('undo after adding block twice', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusFirstTextBlock(page);
  await page.keyboard.type('hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(10);
  await page.keyboard.type('world');

  await undoByKeyboard(page);
  await assertTextBlocks(page, ['hello']);
  await redoByKeyboard(page);
  await assertTextBlocks(page, ['hello', 'world']);
});

test('undo/redo twice after adding block twice', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusFirstTextBlock(page);
  await page.keyboard.type('hello');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(10);
  await page.keyboard.type('world');
  await assertTextBlocks(page, ['hello', 'world']);

  await undoByKeyboard(page);
  await assertTextBlocks(page, ['hello']);

  await undoByKeyboard(page);
  await assertTextBlocks(page, []);

  await redoByClick(page);
  await assertTextBlocks(page, ['hello']);

  await redoByKeyboard(page);
  await assertTextBlocks(page, ['hello', 'world']);
});
