import { test, expect } from '@playwright/test';
import type { SerializedStore } from '../packages/core';
import { DEFAULT_PLAYGROUND, assertStore, assertText } from './utils';

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
