import './utils/declare-test-window.js';

import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyCodeBlockState,
  SHORT_KEY,
  type,
} from './utils/actions/index.js';
import { assertRichTexts } from './utils/asserts.js';
import { test } from './utils/playwright.js';

test('should ctrl+enter works in code block', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyCodeBlockState(page);
  await focusRichText(page);

  await type(page, 'const a = 10;');
  await assertRichTexts(page, ['const a = 10;']);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press(`${SHORT_KEY}+Enter`);
  // TODO fix this
  // actual
  await assertRichTexts(page, ['const a = 10\n;']);
  test.fail();
  // but expected
  await assertRichTexts(page, ['const a = 10;\n']);
});
