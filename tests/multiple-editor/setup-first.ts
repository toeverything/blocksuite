import { expect } from '@playwright/test';

import {
  enterPlaygroundRoom,
  initEmptyParagraphState,
  setMultiEditor,
} from '../utils/actions/index.js';
import { setScope, test } from '../utils/playwright.js';
setScope('FIRST EDITOR');
test.beforeAll(() => {
  setMultiEditor(true);
});

test('ensure enable two editor', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  const count = await page.evaluate(() => {
    return document.querySelectorAll('editor-container').length;
  });

  await expect(count).toBe(2);
});
