import { Page, test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusLine,
  focusRichText,
  pressEnter,
  shiftTab,
} from './utils/actions';
import { assertBlockChildrenIds, assertRichTexts } from './utils/asserts';

const indent = (page: Page) => page.keyboard.press('Tab');
const unindent = shiftTab;

test('basic indent and unindent', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.keyboard.type('text1');
  await pressEnter(page);
  await page.keyboard.type('text2');

  indent(page);
  await assertRichTexts(page, ['text1', 'text2']);
  await assertBlockChildrenIds(page, '0', ['1']);
  await assertBlockChildrenIds(page, '1', ['2']);
  await assertBlockChildrenIds(page, '2', []);

  await unindent(page);
  await assertRichTexts(page, ['text1', 'text2']);
  await assertBlockChildrenIds(page, '0', ['1', '2']);
  await assertBlockChildrenIds(page, '1', []);
  await assertBlockChildrenIds(page, '2', []);
});

test('indent with multiple children', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.keyboard.type('text1');
  await pressEnter(page);
  await page.keyboard.type('text2');
  await pressEnter(page);
  await page.keyboard.type('text3');
  await assertRichTexts(page, ['text1', 'text2', 'text3']);

  indent(page);
  await focusLine(page, 2);
  indent(page);

  await assertRichTexts(page, ['text1', 'text2', 'text3']);
  await assertBlockChildrenIds(page, '0', ['1']);
  await assertBlockChildrenIds(page, '1', ['2', '3']);
});
