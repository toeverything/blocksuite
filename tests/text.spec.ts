import { test } from '@playwright/test';
import { assertSelection, assertTextBlocks } from './utils/asserts';
import {
  enterPlaygroundRoom,
  focusRichText,
  redoByKeyboard,
  undoByKeyboard,
} from './utils/actions';

test('append new text block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
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

test('insert new text block by enter', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await assertTextBlocks(page, ['\n', '\n', '\n']);

  await focusRichText(page, 1);
  await page.keyboard.type('hello');
  await assertTextBlocks(page, ['\n', 'hello', '\n']);

  await page.keyboard.press('Enter');
  await page.keyboard.type('world');
  await assertTextBlocks(page, ['\n', 'hello', 'world', '\n']);
});
