import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockModel } from '@blocksuite/store';

export const getSelectedModelsCommand: Command<
  'host',
  'selectedModels',
  {
    types?: Extract<BlockSuite.SelectionType, 'block' | 'text' | 'image'>[];
  }
> = (ctx, next) => {
  const { host } = ctx;
  assertExists(
    host,
    '`host` is required, you need to use `withHost` command before adding this command to the pipeline.'
  );

  const types = ctx.types ?? ['block', 'text', 'image'];
  const selectedModels: BlockModel[] = [];
  host.std.command
    .chain()
    .withHost()
    .tryAll(chain => [
      chain.getTextSelection(),
      chain.getBlockSelections(),
      chain.getImageSelections(),
    ])
    .getSelectedBlocks({
      types,
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
