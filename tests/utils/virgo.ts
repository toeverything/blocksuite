import type { Page } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { VEditor } from '../../packages/virgo/src/index.js';

export async function getStringFromRichText(
  page: Page,
  index = 0
): Promise<string> {
  await page.waitForTimeout(50);
  return await page.evaluate(index => {
    const richTexts = document.querySelectorAll('rich-text');

    if (!richTexts) {
      throw new Error('Cannot find rich-text');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = (richTexts[index] as any).vEditor as VEditor;
    return editor.yText.toString();
  }, index);
}
