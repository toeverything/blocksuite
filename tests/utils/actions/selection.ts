import type { Page } from '@playwright/test';

export async function getRichTextBoundingBox(
  page: Page,
  blockId: string
): Promise<DOMRect> {
  return await page.evaluate(id => {
    const paragraph = document.querySelector(
      `[data-block-id="${id}"] .virgo-editor`
    );
    const bbox = paragraph?.getBoundingClientRect() as DOMRect;
    return bbox;
  }, blockId);
}
