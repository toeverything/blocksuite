import { test } from '@playwright/test';
import { assertTextBlocks, emptyInput, enterPlaygroundRoom } from './utils';
import { redoByKeyboard, undoByKeyboard } from './utils/keyboard';

test('add new text block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await page.click(emptyInput);
  await page.keyboard.type('hello');
  await page.keyboard.press('Enter');
  await assertTextBlocks(page, ['hello', '\n']);
  await undoByKeyboard(page);
  await assertTextBlocks(page, ['hello']);
  await redoByKeyboard(page);
  await assertTextBlocks(page, ['hello', '\n']);
});
