import type { BlockComponent, Command } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';

import { getPrevContentBlock } from '../../utils/index.js';

function getPrevBlock(std: BlockSuite.Std, path: string) {
  const view = std.view;

  const model = std.doc.getBlock(path)?.model;
  if (!model) return null;
  const prevModel = getPrevContentBlock(std.host, model);
  if (!prevModel) return null;
  return view.getBlock(prevModel.id);
}

export const getPrevBlockCommand: Command<
  'currentSelectionPath',
  'prevBlock',
  {
    path?: string;
  }
> = (ctx, next) => {
  const path = ctx.path ?? ctx.currentSelectionPath;
  assertExists(
    path,
    '`path` is required, you need to pass it in args or ctx before adding this command to the pipeline.'
  );

  const prevBlock = getPrevBlock(ctx.std, path);

  if (prevBlock) {
    next({ prevBlock });
  }
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      prevBlock?: BlockComponent;
    }

    interface Commands {
      getPrevBlock: typeof getPrevBlockCommand;
    }
  }
}
