// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { DeltaInsert, VEditor, VRange } from '@blocksuite/virgo';
import type { Page } from '@playwright/test';

const defaultPlaygroundURL = new URL(`http://localhost:5173/`);

export async function type(page: Page, content: string) {
  await page.keyboard.type(content, { delay: 50 });
}

export async function press(page: Page, content: string) {
  await page.keyboard.press(content, { delay: 50 });
}

export async function enterVirgoPlayground(page: Page) {
  const url = new URL('examples/virgo/index.html', defaultPlaygroundURL);
  await page.goto(url.toString());
}

export async function focusVirgoRichText(page: Page, index = 0): Promise<void> {
  await page.evaluate(index => {
    const richTexts = document
      .querySelector('test-page')
      ?.querySelectorAll('virgo-test-rich-text');

    if (!richTexts) {
      throw new Error('Cannot find virgo-test-rich-text');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (richTexts[index] as any).vEditor.focusEnd();
  }, index);
}

export async function getDeltaFromVirgoRichText(
  page: Page,
  index = 0
): Promise<DeltaInsert> {
  await page.waitForTimeout(100);
  return await page.evaluate(index => {
    const richTexts = document
      .querySelector('test-page')
      ?.querySelectorAll('virgo-test-rich-text');

    if (!richTexts) {
      throw new Error('Cannot find virgo-test-rich-text');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = (richTexts[index] as any).vEditor as VEditor;
    return editor.yText.toDelta();
  }, index);
}

export async function getVRangeFromVirgoRichText(
  page: Page,
  index = 0
): Promise<VRange | null> {
  await page.waitForTimeout(100);
  return await page.evaluate(index => {
    const richTexts = document
      .querySelector('test-page')
      ?.querySelectorAll('virgo-test-rich-text');

    if (!richTexts) {
      throw new Error('Cannot find virgo-test-rich-text');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = (richTexts[index] as any).vEditor as VEditor;
    return editor.getVRange();
  }, index);
}

export async function setVirgoRichTextRange(
  page: Page,
  vRange: VRange,
  index = 0
): Promise<void> {
  await page.evaluate(
    ([vRange, index]) => {
      const richTexts = document
        .querySelector('test-page')
        ?.querySelectorAll('virgo-test-rich-text');

      if (!richTexts) {
        throw new Error('Cannot find virgo-test-rich-text');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const editor = (richTexts[index as number] as any).vEditor as VEditor;
      editor.setVRange(vRange as VRange);
    },
    [vRange, index]
  );
}

export async function getVirgoRichTextLine(
  page: Page,
  index: number,
  i = 0
): Promise<readonly [string, number]> {
  return await page.evaluate(
    ([index, i]) => {
      const richTexts = document
        .querySelector('test-page')
        ?.querySelectorAll('virgo-test-rich-text');

      if (!richTexts) {
        throw new Error('Cannot find virgo-test-rich-text');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const editor = (richTexts[i] as any).vEditor as VEditor;
      const line = editor.getLine(index);
      return [line[0].textContent, line[1]] as const;
    },
    [index, i]
  );
}
