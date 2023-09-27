import type { Command } from '@blocksuite/block-std';
import type { BlockSelection } from '@blocksuite/block-std';

export const getBlockSelectionsCommand: Command<
  never,
  'currentBlockSelections'
> = (ctx, next) => {
  const currentBlockSelections = ctx.std.selection.filter('block');

  next({ currentBlockSelections });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      currentBlockSelections?: BlockSelection[];
    }

    interface Commands {
      getBlockSelections: typeof getBlockSelectionsCommand;
    }
  }
}
