import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  pressEnter,
  type,
} from './utils/actions/index.js';
import { assertTextContain } from './utils/asserts.js';
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
