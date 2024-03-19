import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

/**
 * Retrieves the selected models based on the provided selection types and mode.
 *
 * @param ctx - The command context.
 * @param ctx.types - The selection types to be retrieved. Can be an array of 'block', 'text', or 'image'.
 * @param ctx.mode - The mode of the selection. Can be 'all', 'flat', or 'highest'.
 * ‘all’: Returns all selected models.
 * ‘flat’: Returns all selected models in a flat array.
 * ‘highest’: Returns the highest selected models.
 * @param next - The next function to be called.
 * @returns The selected models.
 */
export const getSelectedModelsCommand: Command<
  never,
  'selectedModels',
  {
    types?: Extract<BlockSuite.SelectionType, 'block' | 'text' | 'image'>[];
    mode?: 'all' | 'flat' | 'highest';
  }
> = (ctx, next) => {
  const types = ctx.types ?? ['block', 'text', 'image'];
  const mode = ctx.mode ?? 'flat';
  const selectedModels: BlockModel[] = [];
  ctx.std.command
    .chain()
    .tryAll(chain => [
      chain.getTextSelection(),
      chain.getBlockSelections(),
      chain.getImageSelections(),
    ])
    .getSelectedBlocks({
      types,
      mode,
    })
    .inline(ctx => {
      const { selectedBlocks } = ctx;
      assertExists(selectedBlocks);
      selectedModels.push(...selectedBlocks.map(el => el.model));
    })
    .run();

  next({ selectedModels });
};

declare global {
  namespace BlockSuite {
    interface CommandContext {
      selectedModels?: BlockModel[];
    }

    interface Commands {
      getSelectedModels: typeof getSelectedModelsCommand;
    }
  }
}
