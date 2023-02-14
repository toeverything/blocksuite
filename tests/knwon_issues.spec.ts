import './utils/declare-test-window.js';

import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  pressEnter,
  type,
} from './utils/actions/index.js';
import { assertRichTexts } from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('#1126', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await page.keyboard.press('Shift+Enter');
  await type(page, '/copy');
  await pressEnter(page);
  // Fixme: `/copy` should not appear
  await assertRichTexts(page, ['hello\n\n/copy']);
});
