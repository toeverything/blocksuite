import { test, expect } from '@playwright/test';
import type { SerializedStore } from '../packages/core';
import {
  defaultPlayground,
  richTextBox,
  emptyInput,
  assertStore,
  assertText,
  awaitAll,
} from './utils';

test('basic input', async ({ page }) => {
  await page.goto(defaultPlayground);
  await page.click(emptyInput);
  await page.type(richTextBox, 'hello');

  const expected: SerializedStore = {
    blocks: { '1': { type: 'text', id: '1', parentId: '0', text: 'hello' } },
    parentMap: { '1': '0' },
  };

  await expect(page).toHaveTitle(/Building Blocks/);
  await assertStore(page, expected);
  await assertText(page, 'hello');
});

test('basic multi user state', async ({ browser, page: pageA }) => {
  await pageA.goto(defaultPlayground);
  await pageA.click(emptyInput);
  await pageA.type(richTextBox, 'hello');

  const pageB = await browser.newPage();
  await pageB.goto(defaultPlayground);

  const expected: SerializedStore = {
    blocks: { '1': { type: 'text', id: '1', parentId: '0', text: 'hello' } },
    parentMap: { '1': '0' },
  };
  // wait until pageB content updated
  await assertText(pageB, 'hello');
  await awaitAll([
    assertText(pageA, 'hello'),
    assertStore(pageA, expected),
    assertStore(pageB, expected),
  ]);
});
