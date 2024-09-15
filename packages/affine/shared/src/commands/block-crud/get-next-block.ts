import type { BlockComponent, Command } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';

import { getNextContentBlock } from '../../utils/index.js';

function getNextBlock(std: BlockSuite.Std, path: string) {
  const view = std.view;
  const model = std.doc.getBlock(path)?.model;
  if (!model) return null;
  const nextModel = getNextContentBlock(std.host, model);
  if (!nextModel) return null;
  return view.getBlock(nextModel.id);
}

export const getNextBlockCommand: Command<
  'currentSelectionPath',
  'nextBlock',
  {
    path?: string;
  }
> = (ctx, next) => {
  const path = ctx.path ?? ctx.currentSelectionPath;
  assertExists(
    path,
    '`path` is required, you need to pass it in args or ctx before adding this command to the pipeline.'
  );

  const nextBlock = getNextBlock(ctx.std, path);

  if (nextBlock) {
    next({ nextBlock });
  }
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      nextBlock?: BlockComponent;
    }

    interface Commands {
      getNextBlock: typeof getNextBlockCommand;
    }
  }
}
