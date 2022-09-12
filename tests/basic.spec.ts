import { test, expect } from '@playwright/test';
import type { SerializedStore } from '../packages/core';
import { DEFAULT_PLAYGROUND, assertStore, assertText, awaitAll } from './utils';

test('basic input', async ({ page }) => {
  await page.goto(DEFAULT_PLAYGROUND);
  await page.click('input');
  await page.type('.ql-editor', 'hello');

  const expected: SerializedStore = {
    blocks: { '1': { type: 'text', id: '1', parentId: '0', text: 'hello' } },
    parentMap: { '1': '0' },
  };

  await expect(page).toHaveTitle(/Building Blocks/);
  await assertStore(page, expected);
  await assertText(page, 'hello');
});

test('basic multi user state', async ({ browser, page }) => {
  await page.goto(DEFAULT_PLAYGROUND);
  await page.click('input');
  await page.type('.ql-editor', 'hello');

  const page2 = await browser.newPage();
  await page2.goto(DEFAULT_PLAYGROUND);

  const expected: SerializedStore = {
    blocks: { '1': { type: 'text', id: '1', parentId: '0', text: 'hello' } },
    parentMap: { '1': '0' },
  };
  // wait until page2 content updated
  await assertText(page2, 'hello');
  await awaitAll([
    assertText(page, 'hello'),
    assertStore(page, expected),
    assertStore(page2, expected),
  ]);
});
