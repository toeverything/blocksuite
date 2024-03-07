import type { Page } from '@playwright/test';

import { waitNextFrame } from './misc.js';

export async function updateBlockType(
  page: Page,
  flavour: BlockSuite.Flavour,
  type?: string
) {
  await page.evaluate(
    ([flavour, type]) => {
      window.host.std.command
        .chain()
        .updateBlockType({
          flavour,
          props: {
            type,
          },
        })
        .run();
    },
    [flavour, type] as [BlockSuite.Flavour, string?]
  );
  await waitNextFrame(page, 400);
}
