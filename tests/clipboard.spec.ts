import { test } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  copyKeyboard,
  pasteKeyboard,
  setQuillSelection,
} from './utils/actions';
import { assertText } from './utils/asserts';

test('clipboard copy paste', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);

  await page.keyboard.type('test');
  await setQuillSelection(page, 0, 3);
  await copyKeyboard(page);
  await pasteKeyboard(page);
  await assertText(page, 'testest');
});
