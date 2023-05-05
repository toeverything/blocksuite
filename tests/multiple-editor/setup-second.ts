import { expect } from '@playwright/test';

import {
  enterPlaygroundRoom,
  focusRichText,
  initEmptyParagraphState,
  setCurrentEditor,
  setMultiEditor,
} from '../utils/actions/index.js';
import { setScope, test } from '../utils/playwright.js';
setScope('SECOND EDITOR');
// eslint-disable-next-line no-empty-pattern
test.beforeAll(() => {
  setMultiEditor(true);
  setCurrentEditor(1);
});
test.afterAll(async ({ page }) => {
  const focusInSecondEditor = await page.evaluate(() => {
    const editor = document.querySelectorAll('editor-container')[1];
    return editor.contains(getSelection().getRangeAt(0).startContainer);
  });
  await expect(focusInSecondEditor).toBe(true);
});

test('ensure enable two editor', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  const count = await page.evaluate(() => {
    return document.querySelectorAll('editor-container').length;
  });

  await expect(count).toBe(2);
});

test('ensure second editor is active', async ({ page }) => {
  await enterPlaygroundRoom(page);
  await initEmptyParagraphState(page);
  await focusRichText(page);
  const focusInSecondEditor = await page.evaluate(() => {
    const editor = document.querySelectorAll('editor-container')[1];
    return editor.contains(getSelection().getRangeAt(0).startContainer);
  });
  await expect(focusInSecondEditor).toBe(true);
});
