import type { Command } from '@blocksuite/block-std';
import type { TextSelection } from '@blocksuite/block-std';

export const getTextSelectionCommand: Command<never, 'textSelection'> = (
  ctx,
  next
) => {
  const textSelection = ctx.std.selection.find('text');
  if (!textSelection) {
    return;
  }

  return next({ textSelection });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      textSelection: TextSelection;
    }

    interface Commands {
      getTextSelection: typeof getTextSelectionCommand;
    }
  }
}
