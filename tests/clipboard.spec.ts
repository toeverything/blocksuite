import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  copyKeyboard,
  pasteKeyboard,
  setQuillSelection,
} from './utils/actions';
import { assertText } from './utils/asserts';

// TODO fix CI
test.skip('clipboard copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.keyboard.type('test');
  await setQuillSelection(page, 0, 3);
  await copyKeyboard(page);
  await focusRichText(page);
  await pasteKeyboard(page);
  await assertText(page, 'testest');
});
