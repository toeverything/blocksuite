import type { Page } from '@playwright/test';

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

    const editor = richTexts[index].vEditor;
    if (!editor) {
      throw new Error('Cannot find vEditor');
    }
    return editor.yText.toString();
  }, index);
}
