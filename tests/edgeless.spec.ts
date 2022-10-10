import { test, expect } from '@playwright/test';
import {
  enterPlaygroundRoom,
  focusRichText,
  switchMode,
} from './utils/actions';
import { assertRichTexts, assertSelection } from './utils/asserts';

test('switch to edgeless mode', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await focusRichText(page);
  await page.keyboard.type('hello');
  await assertRichTexts(page, ['hello']);
  await assertSelection(page, 0, 5, 0);

  await switchMode(page);
  const locator = page.locator('.affine-edgeless-page-block-container');
  await expect(locator).toHaveCount(1);
  await assertRichTexts(page, ['hello']);
  await assertSelection(page, 0, 5, 0);
});
