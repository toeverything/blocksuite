import type { Page } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type {
  Flavour,
  PageBlockComponent,
} from '../../../packages/blocks/src/index.js';
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
        window.testUtils.pageBlock.getSelectedContentBlockElements(
          pageElement,
          ['text', 'block']
        );
      //@ts-ignore
      window.testUtils.pageBlock.updateBlockElementType(
        selectedBlockElements,
        flavour,
        type
      );
    },
    [flavour, type] as [Flavour, string?]
  );
  await waitNextFrame(page);
}
