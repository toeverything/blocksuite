import type { ImageSelection } from '@blocksuite/affine-shared/selection';
import type { Command } from '@blocksuite/block-std';

export const getImageSelectionsCommand: Command<
  never,
  'currentImageSelections'
> = (ctx, next) => {
  const currentImageSelections = ctx.std.selection.filter('image');
  if (currentImageSelections.length === 0) return;

  next({ currentImageSelections });
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      currentImageSelections?: ImageSelection[];
    }

    interface Commands {
      getImageSelections: typeof getImageSelectionsCommand;
    }
  }
}
