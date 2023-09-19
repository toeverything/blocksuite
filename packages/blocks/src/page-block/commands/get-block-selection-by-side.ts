import type { Command } from '@blocksuite/block-std';
import type { BlockSelection } from '@blocksuite/block-std';

export const getBlockSelectionsCommand: Command<never, 'blockSelections'> = (
  ctx,
  next
) => {
  const blockSelections = ctx.std.selection.filter('block');

  return next({ blockSelections });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      blockSelections: BlockSelection[];
    }

    interface Commands {
      getBlockSelections: typeof getBlockSelectionsCommand;
    }
  }
}
