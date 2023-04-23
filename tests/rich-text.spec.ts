import { press } from '@blocksuite/virgo/tests/utils/misc';
import { expect, test } from '@playwright/test';

import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  type,
} from './utils/actions/index.js';

test('ZERO_WIDTH_SPACE should be counted by one cursor position', async ({
  page,
}) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  await page.waitForTimeout(100);
  await page.keyboard.down('Shift');
  await press(page, 'Enter');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(100);
  await type(page, 'asdfg');
  await page.waitForTimeout(100);
  await press(page, 'Enter');
  await page.waitForTimeout(100);
  await page.keyboard.down('Meta');
  await press(page, 'z');
  await page.keyboard.up('Meta');
  await page.waitForTimeout(100);
  await press(page, 'Backspace');
  await page.waitForTimeout(100);
  const line = await page.locator('v-line').last();
  expect(await line.innerText()).toBe('asdf');
});
