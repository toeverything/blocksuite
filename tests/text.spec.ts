import { test } from '@playwright/test';
import { assertSelection, assertTextBlocks } from './utils/asserts';
import {
  emptyInput,
  enterPlaygroundRoom,
  redoByKeyboard,
  undoByKeyboard,
} from './utils/actions';

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
