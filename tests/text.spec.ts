import { test } from '@playwright/test';
import {
  assertSelection,
  assertTextBlocks,
  emptyInput,
  enterPlaygroundRoom,
} from './utils';
import { redoByKeyboard, undoByKeyboard } from './utils/keyboard';

test('add new text block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.click(emptyInput);
  await page.keyboard.type('hello');
  await assertSelection(page, 0, 5, 0);

  await page.keyboard.press('Enter');
  await assertTextBlocks(page, ['hello', '\n']);
  await assertSelection(page, 1, 0, 0);

  await undoByKeyboard(page);
  await assertTextBlocks(page, ['hello']);
  await assertSelection(page, 0, 5, 0);

  await redoByKeyboard(page);
  await assertTextBlocks(page, ['hello', '\n']);
  await assertSelection(page, 1, 0, 0);
});
