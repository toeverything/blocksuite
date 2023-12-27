import type { Flavour } from '@blocks/models.js';
import type { BlockElement } from '@lit/element/index.js';
import type { Page } from '@playwright/test';

import { waitNextFrame } from './misc.js';

export async function updateBlockType(
  page: Page,
  flavour: Flavour,
  type?: string
) {
  await page.evaluate(
    ([flavour, type]) => {
      const blocks: BlockElement[] = [];
      window.host.std.command
        .pipe()
        .withHost()
        .tryAll(chain => [chain.getTextSelection(), chain.getBlockSelections()])
        .getSelectedBlocks({
          types: ['text', 'block'],
        })
        .inline(ctx => {
          const { selectedBlocks } = ctx;
          if (!selectedBlocks) return;
          blocks.push(...selectedBlocks);
        })
        .run();

      window.testUtils.pageBlock.updateBlockElementType(blocks, flavour, type);
    },
    [flavour, type] as [Flavour, string?]
  );
  await waitNextFrame(page, 400);
}
