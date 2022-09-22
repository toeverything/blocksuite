/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { expect, type Page } from '@playwright/test';
import type { SerializedStore } from '../../packages/store';

export async function assertEmpty(page: Page) {
  const actual = await page.innerText('.block-placeholder-input');
  expect(actual).toBe('');
}

export async function assertText(page: Page, text: string) {
  const actual = await page.innerText('.ql-editor');
  expect(actual).toBe(text);
}

export async function assertTextBlocks(page: Page, texts: string[]) {
  const actual = await page.locator('.ql-editor').allInnerTexts();
  expect(actual).toEqual(texts);
}

export async function assertBlockCount(
  page: Page,
  flavour: string,
  count: number
) {
  const actual = await page.locator(`${flavour}-block-element`).count();
  expect(actual).toBe(count);
}

export async function assertSelection(
  page: Page,
  richTextIndex: number,
  rangeIndex: number,
  rangeLength: number
) {
  const actual = await page.evaluate(
    ({ richTextIndex }) => {
      const quill =
        // @ts-ignore
        document.querySelectorAll('rich-text')[richTextIndex]?._quill!;
      return quill.getSelection();
    },
    { richTextIndex }
  );
  expect(actual).toEqual({ index: rangeIndex, length: rangeLength });
}

export async function assertSelectBlocks(page: Page, count: number) {
  const actual = await page.evaluate(() => {
     const selectLength =
       document.querySelector('page-container')?.selection.selectionInfo
         ?.selectedNodesIds?.length;
     return selectLength || 0;
  });
  expect(actual).toBe(count);
}

export async function assertStore(page: Page, expected: SerializedStore) {
  const actual = (await page.evaluate(() =>
    // @ts-ignore
    window.store.doc.toJSON()
  )) as SerializedStore;
  expect(actual).toEqual(expected);
}
