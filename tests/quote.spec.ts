import { test } from './utils/playwright.js';
import { assertTextContain } from './utils/asserts.js';
import {
  enterPlaygroundRoom,
  focusRichText,
  pressEnter,
  initEmptyParagraphState,
  type,
} from './utils/actions/index.js';

// Fixes: https://github.com/toeverything/blocksuite/issues/995
test('prohibit creating divider within quote', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, '>');
  await page.keyboard.press('Space', { delay: 50 });
  await type(page, '123');
  await pressEnter(page);
  await type(page, '---');
  await page.keyboard.press('Space', { delay: 50 });
  await assertTextContain(page, '---');
});
