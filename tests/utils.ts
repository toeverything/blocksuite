import { expect, type Page } from '@playwright/test';
import type { SerializedStore } from '../packages/core';

export const DEFAULT_PLAYGROUND = 'http://localhost:5173/';

export async function getStore(page: Page): Promise<SerializedStore> {
  // @ts-ignore
  return page.evaluate(() => window.store.doc.toJSON());
}

export async function assertText(page: Page, text: string) {
  const actual = await page.innerText('.ql-editor');
  expect(actual).toBe(text);
}

export async function assertStore(page: Page, expected: SerializedStore) {
  const actual = await getStore(page);
  expect(actual).toEqual(expected);
}
