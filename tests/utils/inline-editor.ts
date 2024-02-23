import type { Page } from '@playwright/test';

import { currentEditorIndex } from './multiple-editor.js';

export async function getStringFromRichText(
  page: Page,
  index = 0
): Promise<string> {
  await page.waitForTimeout(50);
  return page.evaluate(
    ([index, currentEditorIndex]) => {
      const editorHost =
        document.querySelectorAll('editor-host')[currentEditorIndex];
      const richTexts = editorHost.querySelectorAll('rich-text');

      if (!richTexts) {
        throw new Error('Cannot find rich-text');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const editor = (richTexts[index] as any).inlineEditor;
      return editor.yText.toString();
    },
    [index, currentEditorIndex]
  );
}
