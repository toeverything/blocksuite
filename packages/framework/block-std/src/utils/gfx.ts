import type { Doc } from '@blocksuite/store';

import { effect } from '@lit-labs/preact-signals';

import { SurfaceBlockModel } from '../gfx/index.js';

export function onSurfaceAdded(
  doc: Doc,
  callback: (model: SurfaceBlockModel | null) => void
) {
  let found = false;
  let foundId = '';

  const dispose = effect(() => {
    // if the surface is already found, no need to search again
    if (found && doc.getBlock(foundId)) {
      return;
    }

    for (const block of Object.values(doc.blocks.value)) {
      if (block.model instanceof SurfaceBlockModel) {
        callback(block.model);
        found = true;
        foundId = block.id;
      }
      return;
    }

    callback(null);
  });

  return dispose;
}
