/// <reference types="@blocksuite/affine-shared/commands" />
import type {
  BlockComponent,
  Command,
  InitCommandCtx,
} from '@blocksuite/block-std';

import { isPeekable, peek } from './peekable.js';

const getSelectedPeekableBlocks = (cmd: InitCommandCtx) => {
  const [result, ctx] = cmd.std.command
    .chain()
    .tryAll(chain => [chain.getTextSelection(), chain.getBlockSelections()])
    .getSelectedBlocks({ types: ['text', 'block'] })
    .run();
  return ((result ? ctx.selectedBlocks : []) || []).filter(isPeekable);
};

export const getSelectedPeekableBlocksCommand: Command<
  'selectedBlocks',
  'selectedPeekableBlocks'
> = (ctx, next) => {
  const selectedPeekableBlocks = getSelectedPeekableBlocks(ctx);
  if (selectedPeekableBlocks.length > 0) {
    next({ selectedPeekableBlocks });
  }
};

export const peekSelectedBlockCommand: Command<'selectedBlocks'> = (
  ctx,
  next
) => {
  const peekableBlocks = getSelectedPeekableBlocks(ctx);
  // if there are multiple blocks, peek the first one
  const block = peekableBlocks.at(0);

  if (block) {
    peek(block);
    next();
  }
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      selectedPeekableBlocks?: BlockComponent[];
    }

    interface Commands {
      peekSelectedBlock: typeof peekSelectedBlockCommand;
      getSelectedPeekableBlocks: typeof getSelectedPeekableBlocksCommand;
      // todo: add command for peek an inline element?
    }
  }
}
