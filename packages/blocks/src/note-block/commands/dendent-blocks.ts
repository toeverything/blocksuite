import type { Command } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { matchFlavours } from '@blocksuite/affine-shared/utils';

export const dedentBlocks: Command<
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
      blockIds = [text.from.blockId, text.to?.blockId].filter(
        (x): x is string => !!x
      );
    } else {
      blockIds = std.selection.getGroup('note').map(sel => sel.blockId);
    }
  }

  if (!blockIds || !blockIds.length || doc.readonly) return;

  // Find the first model that can be unindented
  let firstOutdentIndex = -1;
  let firstParent: BlockModel | null;
  for (let i = 0; i < blockIds.length; i++) {
    firstParent = doc.getParent(blockIds[i]);
    if (firstParent && !matchFlavours(firstParent, ['affine:note'])) {
      firstOutdentIndex = i;
      break;
    }
  }

  if (firstOutdentIndex === -1) return;

  if (stopCapture) doc.captureSync();

  // Find all the models that can be unindented
  const outdentModels = blockIds.slice(firstOutdentIndex);
  // Form bottom to top
  // Only outdent the models which parent is not in the outdentModels
  // When parent is in the outdentModels
  // It means that children will be unindented with their parent
  for (let i = outdentModels.length - 1; i >= 0; i--) {
    const model = outdentModels[i];
    const parent = doc.getParent(model);
    if (parent && !outdentModels.includes(parent.id)) {
      std.command.exec('dedentBlock', { blockId: model, stopCapture: false });
    }
  }

  return next();
};
