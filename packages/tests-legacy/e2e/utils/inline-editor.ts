import type { Page } from '@playwright/test';

export async function getStringFromRichText(
  page: Page,
  index = 0
): Promise<string> {
  await page.waitForTimeout(50);
  return page.evaluate(
    ([index]) => {
      const editorHost = document.querySelector('editor-host');
      const richTexts = editorHost?.querySelectorAll('rich-text');

      if (!richTexts) {
        throw new Error('Cannot find rich-text');
      }

      const editor = (richTexts[index] as any).inlineEditor;
      return editor.yText.toString();
    },
    [index]
  );
}
