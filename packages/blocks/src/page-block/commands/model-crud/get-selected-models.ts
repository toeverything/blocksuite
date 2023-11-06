import type { Command } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import { getSelectedContentModels } from '../../utils/index.js';

export const getSelectedModelsCommand: Command<
  'root',
  'selectedModels',
  {
    selectionType?: Extract<
      BlockSuite.SelectionType,
      'block' | 'text' | 'image'
    >[];
  }
> = (ctx, next) => {
  const { root } = ctx;
  assertExists(
    root,
    '`root` is required, you need to use `withRoot` command before add this command to the pipeline.'
  );

  const selectionType = ctx.selectionType ?? ['block', 'text', 'image'];
  const selectedModels = getSelectedContentModels(root, selectionType);

  next({ selectedModels });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      selectedModels?: BaseBlockModel[];
    }

    interface Commands {
      getSelectedModels: typeof getSelectedModelsCommand;
    }
  }
}
