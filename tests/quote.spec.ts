import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  pressArrowDown,
  pressArrowRight,
  pressArrowUp,
  pressEnter,
  type,
} from './utils/actions/index.js';
import { assertRichTextVRange, assertTextContain } from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('prohibit creating divider within quote', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/995',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '>');
  await page.keyboard.press('Space', { delay: 50 });
  await focusRichText(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '---');
  await page.keyboard.press('Space', { delay: 50 });
  await assertTextContain(page, '---');
});

test('quote arrow up/down', async ({ page }) => {
  test.info().annotations.push({
    type: 'issue',
    description: 'https://github.com/toeverything/blocksuite/issues/2834',
  });
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);

  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await pressEnter(page);
  await type(page, 'foo');
  await pressEnter(page);
  await type(page, '> 123123123');
  await pressEnter(page);
  await type(page, '123');
  await pressEnter(page);
  await type(page, '123123123');
  await pressEnter(page);
  await pressEnter(page);
  await type(page, 'hello');
  await pressEnter(page);
  await type(page, 'world');
  await pressEnter(page);
  await type(page, 'foo');

  await assertRichTextVRange(page, 6, 3, 0);
  await pressArrowUp(page);
  await assertRichTextVRange(page, 5, 2, 0);
  await pressArrowUp(page);
  await assertRichTextVRange(page, 4, 3, 0);
  await pressArrowUp(page);
  await assertRichTextVRange(page, 3, 14, 0);
  await pressArrowRight(page, 9);
  await assertRichTextVRange(page, 3, 23, 0);
  await pressArrowUp(page);
  await assertRichTextVRange(page, 3, 13, 0);
  await pressArrowUp(page);
  await assertRichTextVRange(page, 3, 3, 0);
  await pressArrowUp(page);
  await assertRichTextVRange(page, 2, 3, 0);
  await pressArrowUp(page);
  await assertRichTextVRange(page, 1, 2, 0);
  await pressArrowUp(page);
  await assertRichTextVRange(page, 0, 3, 0);
  await pressArrowUp(page);
  await assertRichTextVRange(page, 0, 0, 0);
  await pressArrowRight(page, 4);
  await assertRichTextVRange(page, 0, 4, 0);
  await pressArrowDown(page);
  await assertRichTextVRange(page, 1, 3, 0);
  await pressArrowDown(page);
  await assertRichTextVRange(page, 2, 3, 0);
  await pressArrowDown(page);
  await assertRichTextVRange(page, 3, 0, 0);
  await pressArrowRight(page, 9);
  await assertRichTextVRange(page, 3, 9, 0);
  await pressArrowDown(page);
  await assertRichTextVRange(page, 3, 13, 0);
  await pressArrowDown(page);
  await assertRichTextVRange(page, 3, 17, 0);
  await pressArrowDown(page);
  await assertRichTextVRange(page, 4, 5, 0);
  await pressArrowDown(page);
  await assertRichTextVRange(page, 5, 4, 0);
  await pressArrowDown(page);
  await assertRichTextVRange(page, 6, 3, 0);
});
