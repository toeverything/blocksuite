// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { DeltaInsert, VEditor, VRange } from '@blocksuite/virgo';
import { expect, type Page } from '@playwright/test';

const defaultPlaygroundURL = new URL(`http://localhost:5173/`);

export async function type(page: Page, content: string) {
  await page.keyboard.type(content, { delay: 50 });
}

export async function press(page: Page, content: string) {
  await page.keyboard.press(content, { delay: 50 });
  await page.waitForTimeout(100);
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

export async function getVRangeIndexRect(
  page: Page,
  [richTextIndex, vIndex]: [number, number],
  coordOffSet: { x: number; y: number } = { x: 0, y: 0 }
) {
  const rect = await page.evaluate(
    ({ richTextIndex, vIndex, coordOffSet }) => {
      const richText = document.querySelectorAll('virgo-test-rich-text')[
        richTextIndex
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any;
      const domRange = richText.vEditor.toDomRange({
        index: vIndex,
        length: 0,
      });
      const pointBound = domRange.getBoundingClientRect();
      return {
        x: pointBound.left + coordOffSet.x,
        y: pointBound.top + pointBound.height / 2 + coordOffSet.y,
      };
    },
    {
      richTextIndex,
      vIndex,
      coordOffSet,
    }
  );
  return rect;
}

export async function assertSelection(
  page: Page,
  richTextIndex: number,
  rangeIndex: number,
  rangeLength = 0
) {
  const actual = await page.evaluate(
    ([richTextIndex]) => {
      const richText = document?.querySelectorAll('virgo-test-rich-text')[
        richTextIndex
      ];
      // @ts-ignore
      const vEditor = richText.vEditor;
      return vEditor?.getVRange();
    },
    [richTextIndex]
  );
  expect(actual).toEqual({ index: rangeIndex, length: rangeLength });
}
