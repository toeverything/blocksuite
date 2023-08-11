import type { Flavour, PageBlockComponent } from '@blocksuite/blocks';
import type { Page } from '@playwright/test';

import { waitNextFrame } from './misc.js';

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
        //@ts-ignore
        window.testUtils.pageBlock.getSelectedContentBlockElements(pageElement);
      //@ts-ignore
      window.testUtils.pageBlock.updateBlockElementType(
        pageElement,
        selectedBlockElements,
        flavour,
        type
      );
    },
    [flavour, type] as [Flavour, string?]
  );
  await waitNextFrame(page);
}
