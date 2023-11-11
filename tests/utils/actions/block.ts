import type { Page } from '@playwright/test';
import { assertExists } from 'utils/asserts.js';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { Flavour } from '../../../packages/blocks/src/index.js';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { BlockElement } from '../../../packages/lit/src/index.js';
import { waitNextFrame } from './misc.js';

export async function updateBlockType(
  page: Page,
  flavour: Flavour,
  type?: string
) {
  await page.evaluate(
    ([flavour, type]) => {
      const blocks: BlockElement[] = [];
      window.root.std.command
        .pipe()
        .withRoot()
        .tryAll(chain => [chain.getTextSelection(), chain.getBlockSelections()])
        .getSelectedBlocks({
          types: ['text', 'block'],
        })
        .inline(ctx => {
          const { selectedBlocks } = ctx;
          assertExists(selectedBlocks);
          blocks.push(...selectedBlocks);
        })
        .run();

      window.testUtils.pageBlock.updateBlockElementType(blocks, flavour, type);
    },
    [flavour, type] as [Flavour, string?]
  );
  await waitNextFrame(page, 400);
}
