import type { Command, TextSelection } from '@blocksuite/block-std';

export const getTextSelectionCommand: Command<never, 'currentTextSelection'> = (
  ctx,
  next
) => {
  const currentTextSelection = ctx.std.selection.find('text');
  if (!currentTextSelection) return;

  next({ currentTextSelection });
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      currentTextSelection?: TextSelection;
    }

    interface Commands {
      getTextSelection: typeof getTextSelectionCommand;
    }
  }
}
