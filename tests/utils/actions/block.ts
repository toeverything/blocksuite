import type { Flavour, PageBlockComponent } from '@blocksuite/blocks';
import type { Page } from '@playwright/test';

export async function updateBlockType(
  page: Page,
  flavour: Flavour,
  type?: string
) {
  await page.evaluate(
    ([flavour, type]) => {
      //@ts-ignore
      const pageElement = window.root.querySelector(
        '[data-block-id]'
      ) as PageBlockComponent;
      const selectedBlockElements =
        pageElement.utilManager.getSelectedContentBlockElements(pageElement);
      pageElement.utilManager.updateBlockElementType(
        pageElement,
        selectedBlockElements,
        flavour,
        type
      );
    },
    [flavour, type] as [Flavour, string?]
  );
}
