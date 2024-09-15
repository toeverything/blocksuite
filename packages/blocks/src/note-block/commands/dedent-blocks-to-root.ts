import type { Command } from '@blocksuite/block-std';

import { matchFlavours } from '@blocksuite/affine-shared/utils';

export const dedentBlocksToRoot: Command<
  never,
  never,
  {
    blockIds?: string[];
    stopCapture?: boolean;
  }
> = (ctx, next) => {
  let { blockIds } = ctx;
  const { std, stopCapture = true } = ctx;
  const { doc } = std;
  if (!blockIds || !blockIds.length) {
    const text = std.selection.find('text');
    if (text) {
      // If the text selection is not at the beginning of the block, use default behavior
      if (text.from.index !== 0) return;

      blockIds = [text.from.blockId, text.to?.blockId].filter(
        (x): x is string => !!x
      );
    } else {
      blockIds = std.selection.getGroup('note').map(sel => sel.blockId);
    }
  }

  if (!blockIds || !blockIds.length || doc.readonly) return;

  if (stopCapture) doc.captureSync();
  for (let i = blockIds.length - 1; i >= 0; i--) {
    const model = blockIds[i];
    const parent = doc.getParent(model);
    if (parent && !matchFlavours(parent, ['affine:note'])) {
      std.command.exec('dedentBlockToRoot', {
        blockId: model,
        stopCapture: false,
      });
    }
  }

  return next();
};
