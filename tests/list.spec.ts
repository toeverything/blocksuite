import { test, expect } from '@playwright/test';
import {
  assertBlockChildrenFlavours,
  assertBlockChildrenIds,
  assertBlockCount,
  assertRichTexts,
  assertTextContent,
} from './utils/asserts';
import {
  addBulletedListByClick,
  enterPlaygroundRoom,
  enterPlaygroundWithList,
  focusRichText,
  pressEnter,
  shiftTab,
  switchToNumberedListByClick,
  undoByClick,
  undoByKeyboard,
} from './utils/actions';

test('add new bulleted list', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await addBulletedListByClick(page);
  await addBulletedListByClick(page);
  await assertRichTexts(page, ['\n', '\n', '\n']);
  await assertBlockCount(page, 'list', 2);
});

test('switch to numbered list block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await addBulletedListByClick(page);

  const list = page.locator('list-block-element').nth(0);
  await list.click();
  await switchToNumberedListByClick(page);

  const listSelector = '.affine-list-rich-text-wrapper';
  const bulletIconSelector = `${listSelector} > div`;
  await assertTextContent(page, bulletIconSelector, /1\./);

  await undoByClick(page);
  const numberIconSelector = `${listSelector} > svg`;
  await expect(page.locator(numberIconSelector)).toHaveCount(1);
});

test('indent list block', async ({ page }) => {
  await enterPlaygroundWithList(page);

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

  await focusRichText(page, 1);
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

test('nested list blocks', async ({ page }) => {
  await enterPlaygroundWithList(page);

  await focusRichText(page, 0);
  await page.keyboard.type('123');

  await focusRichText(page, 1);
  await page.keyboard.press('Tab');
  await page.keyboard.type('456');

  await focusRichText(page, 2);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.type('789');

  await assertRichTexts(page, ['123', '456', '789']);
  await assertBlockChildrenIds(page, '0', ['1']);
  await assertBlockChildrenIds(page, '1', ['2']);
  await assertBlockChildrenIds(page, '2', ['3']);
});
