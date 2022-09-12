import { test, expect, type Page } from '@playwright/test';
import type { SerializedStore } from '../packages/core';

const DEFAULT_PLAYGROUND = 'http://localhost:5173/';

async function getStore(page: Page): Promise<SerializedStore> {
  // @ts-ignore
  return page.evaluate(() => window.store.doc.toJSON());
}

async function assertText(page: Page, text: string) {
  const actual = await page.innerText('.ql-editor');
  expect(actual).toBe(text);
}

async function assertStore(page: Page, expected: SerializedStore) {
  const actual = await getStore(page);
  expect(actual).toEqual(expected);
}

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
