import '../utils/declare-test-window.js';

import {
  addFrameByClick,
  captureHistory,
  disconnectByClick,
  dragBetweenIndices,
  enterPlaygroundRoom,
  focusRichText,
  focusTitle,
  initEmptyParagraphState,
  pressEnter,
  redoByClick,
  redoByKeyboard,
  SHORT_KEY,
  switchReadonly,
  type,
  undoByClick,
  undoByKeyboard,
  waitDefaultPageLoaded,
  waitForRemoteUpdateSignal,
} from '../utils/actions/index.js';
import {
  assertBlockChildrenIds,
  assertEmpty,
  assertRichTexts,
  assertStore,
  assertStoreMatchJSX,
  assertText,
  assertTitle,
  defaultStore,
} from '../utils/asserts.js';
import { test } from '../utils/playwright.js';

test('#1126', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await type(page, 'hello');
  await page.keyboard.press('Shift+Enter');
  await type(page, '/copy');
  await pressEnter(page);
  await assertRichTexts(page, ['hello\n\n/copy']);
});
