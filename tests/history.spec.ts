import { test } from '@playwright/test';
import { assertText, assertTextBlocks } from './utils/asserts';
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
  await assertText(page, '\n');
  await redoByClick(page);
  await assertText(page, 'hello');

  await undoByClick(page);
  await assertText(page, '\n');
  await redoByClick(page);
  await assertText(page, 'hello');
});

test('undo/redo with keyboard', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.click(emptyInput);
  await page.type(richTextBox, 'hello');

  await assertText(page, 'hello');
  await undoByKeyboard(page);
  await assertText(page, '\n');
  await redoByKeyboard(page);
  await assertText(page, 'hello');
});

test('undo after adding block twice', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.click(emptyInput);
  await page.keyboard.type('hello');
  await page.keyboard.press('Enter');
  await page.keyboard.type('world');

  await undoByKeyboard(page);
  await assertTextBlocks(page, ['hello', '\n']);
  await redoByKeyboard(page);
  await assertTextBlocks(page, ['hello', 'world']);
});
