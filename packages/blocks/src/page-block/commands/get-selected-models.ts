import type { Command } from '@blocksuite/block-std';
import { assertInstanceOf } from '@blocksuite/global/utils';
import { BlockSuiteRoot } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';

import { getSelectedContentModels } from '../utils/index.js';

export const getSelectedModelsCommand: Command<
  never,
  'selectedModels',
  {
    selectionType?: Extract<
      BlockSuite.SelectionType,
      'block' | 'text' | 'image'
    >[];
  }
> = (ctx, next) => {
  const { root } = ctx.std;
  try {
    assertInstanceOf(root, BlockSuiteRoot);
  } catch {
    return Promise.resolve();
  }
  const selectionType = ctx.selectionType ?? ['block', 'text', 'image'];
  const selectedModels = getSelectedContentModels(root, selectionType);

  return next({ selectedModels });
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
