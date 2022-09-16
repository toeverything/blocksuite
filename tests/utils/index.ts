import { expect, type Page } from '@playwright/test';
import type { SerializedStore } from '../../packages/framework/src';

const defaultPlayground = 'http://localhost:5173/';
export const emptyInput = 'input';
export const richTextBox = '.ql-editor';

export async function assertText(page: Page, text: string) {
  const actual = await page.innerText('.ql-editor');
  expect(actual).toBe(text);
}

export async function assertTextBlocks(page: Page, texts: string[]) {
  const actual = await page.locator('.ql-editor').allInnerTexts();
  expect(actual).toEqual(texts);
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

export async function assertStore(page: Page, expected: SerializedStore) {
  const actual = (await page.evaluate(() =>
    // @ts-ignore
    window.store.doc.toJSON()
  )) as SerializedStore;
  expect(actual).toEqual(expected);
}

export async function enterPlaygroundRoom(page: Page, room?: string) {
  if (!room) {
    room = `virgo-${Math.random().toFixed(8).substring(2)}`;
  }
  await page.goto(`${defaultPlayground}?room=${room}`);
  return room;
}

export async function undoByClick(page: Page) {
  await page.click('text=Undo');
}

export async function redoByClick(page: Page) {
  await page.click('text=Redo');
}
