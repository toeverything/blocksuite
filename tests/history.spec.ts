import { test } from '@playwright/test';
import { assertText } from './utils/asserts';
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
