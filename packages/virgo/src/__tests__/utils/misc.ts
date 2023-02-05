import type { DeltaInsert } from '@blocksuite/virgo/types.js';
import type { VEditor, VRange } from '@blocksuite/virgo/virgo.js';
import type { Page } from '@playwright/test';

export async function enterPlayground(page: Page): Promise<void> {
  await page.goto('http://localhost:5173/examples/virgo/');
}

export async function focusRichText(page: Page): Promise<void> {
  const editorPosition = await page.evaluate(() => {
    const editor = document
      .querySelector('test-page')
      ?.shadowRoot?.querySelector('rich-text')
      ?.shadowRoot?.querySelector('[data-virgo-root="true"]');

    if (!editor) {
      throw new Error('Cannot find editor');
    }

    return editor.getBoundingClientRect();
  });

  await page.mouse.click(editorPosition.x + 400, editorPosition.y + 400);
}

export async function pageType(page: Page, text: string): Promise<void> {
  await page.keyboard.type(text, { delay: 50 });
}

export async function pagePress(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key, { delay: 50 });
}

export async function getDeltaFromFirstEditor(
  page: Page
): Promise<DeltaInsert> {
  await page.waitForTimeout(50);
  return await page.evaluate(() => {
    const richTextA = document
      .querySelector('test-page')
      ?.shadowRoot?.querySelector('rich-text');

    if (!richTextA) {
      throw new Error('Cannot find editor');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = (richTextA as any).vEditor as VEditor;
    return editor.yText.toDelta();
  });
}

export async function setFirstEditorRange(
  page: Page,
  vRange: VRange
): Promise<void> {
  await page.evaluate(vRange => {
    const richTextA = document
      .querySelector('test-page')
      ?.shadowRoot?.querySelector('rich-text');

    if (!richTextA) {
      throw new Error('Cannot find editor');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = (richTextA as any).vEditor as VEditor;
    editor.setVRange(vRange);
  }, vRange);
}
