import { test } from '@playwright/test';
import { assertEmpty, assertText, assertTextBlocks } from './utils/asserts';
import {
  emptyInput,
  enterPlaygroundRoom,
  redoByClick,
  redoByKeyboard,
  richTextBox,
  undoByClick,
  undoByKeyboard,
} from './utils/actions';

test('basic paired undo/redo', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.click(emptyInput);
  await page.type(richTextBox, 'hello');

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
  await page.click(emptyInput);
  await page.type(richTextBox, 'hello');

  await assertText(page, 'hello');
  await undoByKeyboard(page);
  await assertEmpty(page);
  await redoByClick(page); // FIXME back to void state without quill, can't simply redo with quill handler
  await assertText(page, 'hello');
});

test('undo after adding block twice', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.click(emptyInput);
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
  await page.click(emptyInput);
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
