import { test } from '@playwright/test';
import {
  assertBlockChildren,
  assertBlockCount,
  assertTextBlocks,
} from './utils/asserts';
import {
  addListByClick,
  enterPlaygroundRoom,
  enterPlaygroundWithList,
  undoByKeyboard,
} from './utils/actions';

test('add new list block by click', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await addListByClick(page);
  await addListByClick(page);
  await assertTextBlocks(page, ['\n', '\n', '\n']);
  await assertBlockCount(page, 'list', 2);
});

test('nested list block', async ({ page }) => {
  await enterPlaygroundWithList(page);
  await page.waitForTimeout(10);

  const secondList = page.locator('list-block-element').nth(1);
  await secondList.click();
  await page.keyboard.press('Tab');

  await assertBlockChildren(page, '0', ['1', '3']);
  await assertBlockChildren(page, '1', ['2']);

  await undoByKeyboard(page);
  await assertBlockChildren(page, '0', ['1', '2', '3']);
});
