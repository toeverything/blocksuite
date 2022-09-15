import { test } from '@playwright/test';
import {
  richTextBox,
  emptyInput,
  assertText,
  enterPlaygroundRoom,
  clickUndo,
  clickRedo,
} from './utils';
import { keyboardRedo, keyboardUndo } from './utils/keyboard';

test('basic paired undo/redo', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.click(emptyInput);
  await page.type(richTextBox, 'hello');

  await assertText(page, 'hello');
  await clickUndo(page);
  await assertText(page, '\n');
  await clickRedo(page);
  await assertText(page, 'hello');

  await clickUndo(page);
  await assertText(page, '\n');
  await clickRedo(page);
  await assertText(page, 'hello');
});

test('undo/redo with keyboard', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.click(emptyInput);
  await page.type(richTextBox, 'hello');

  await assertText(page, 'hello');
  await keyboardUndo(page);
  await assertText(page, '\n');
  await keyboardRedo(page);
  await assertText(page, 'hello');
});
