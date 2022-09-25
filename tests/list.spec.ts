import { test } from '@playwright/test';
import {
  assertBlockChildrenFlavours,
  assertBlockChildrenIds,
  assertBlockCount,
  assertRichTexts,
} from './utils/asserts';
import {
  addListByClick,
  enterPlaygroundRoom,
  enterPlaygroundWithList,
  focusRichText,
  pressEnter,
  shiftTab,
  undoByKeyboard,
  waitNextFrame,
} from './utils/actions';

test('add new list block by click', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await addListByClick(page);
  await addListByClick(page);
  await assertRichTexts(page, ['\n', '\n', '\n']);
  await assertBlockCount(page, 'list', 2);
});

test('indent list block', async ({ page }) => {
  await enterPlaygroundWithList(page);
  await waitNextFrame(page);

  const secondList = page.locator('list-block-element').nth(1);
  await secondList.click();
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n', 'hello', '\n']);

  await page.keyboard.press('Tab');
  await assertRichTexts(page, ['\n', 'hello', '\n']);
  await assertBlockChildrenIds(page, '0', ['1', '3']);
  await assertBlockChildrenIds(page, '1', ['2']);

  await undoByKeyboard(page);
  await assertBlockChildrenIds(page, '0', ['1', '2', '3']);
});

test('unindent list block', async ({ page }) => {
  await enterPlaygroundWithList(page);
  await waitNextFrame(page);

  const secondList = page.locator('list-block-element').nth(1);
  await secondList.click();
  await page.keyboard.press('Tab');

  await assertBlockChildrenIds(page, '0', ['1', '3']);
  await assertBlockChildrenIds(page, '1', ['2']);

  await shiftTab(page);
  await assertBlockChildrenIds(page, '0', ['1', '2', '3']);

  await shiftTab(page);
  await assertBlockChildrenIds(page, '0', ['1', '2', '3']);
});

test('insert new list block by enter', async ({ page }) => {
  await enterPlaygroundWithList(page);
  await waitNextFrame(page);

  await assertRichTexts(page, ['\n', '\n', '\n']);

  await focusRichText(page, 1);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['\n', 'hello', '\n']);

  await pressEnter(page);
  await page.keyboard.type('world');
  await assertRichTexts(page, ['\n', 'hello', 'world', '\n']);
  await assertBlockChildrenFlavours(page, '0', [
    'list',
    'list',
    'list',
    'list',
  ]);
});
