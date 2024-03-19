import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

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
