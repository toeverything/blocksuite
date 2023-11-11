import type { Page } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { Flavour } from '../../../packages/blocks/src/index.js';
import { waitNextFrame } from './misc.js';

export async function updateBlockType(
  page: Page,
  flavour: Flavour,
  type?: string
) {
  await page.evaluate(
    ([flavour, type]) => {
      const selectedBlocks = window.root.std.command
        .pipe()
        .withRoot()
        .tryAll(chain => [chain.getTextSelection(), chain.getBlockSelections()])
        .getSelectedBlocks({
          types: ['text', 'block'],
        });
      //@ts-ignore
      window.testUtils.pageBlock.updateBlockElementType(
        selectedBlocks,
        flavour,
        type
      );
    },
    [flavour, type] as [Flavour, string?]
  );
  await waitNextFrame(page, 400);
}
