import { test } from '@playwright/test';
import {
  richTextBox,
  emptyInput,
  assertText,
  enterPlaygroundRoom,
  undoByClick,
  redoByClick,
} from './utils';
import { redoByKeyboard, undoByKeyboard } from './utils/keyboard';

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
