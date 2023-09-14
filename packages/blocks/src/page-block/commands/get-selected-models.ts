import type { Command } from '@blocksuite/block-std';
import { assertInstanceOf } from '@blocksuite/global/utils';
import { BlockSuiteRoot } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';

import { getSelectedContentBlockElements } from '../utils/index.js';

export const getSelectedModelsCommand: Command<
  never,
  'selectedModels' | 'isTextSelection',
  {
    selectionType?: Extract<
      BlockSuite.SelectionType,
      'block' | 'text' | 'image'
    >[];
  }
> = (ctx, next) => {
  const { root, selection } = ctx.std;
  try {
    assertInstanceOf(root, BlockSuiteRoot);
  } catch {
    return Promise.resolve();
  }
  const selectionType = ctx.selectionType ?? ['block', 'text', 'image'];
  const selectedElements = getSelectedContentBlockElements(root, selectionType);
  const textSelection = selection.find('text');
  const selectedModels = selectedElements.map(selectedElement => {
    return selectedElement.model;
  });

  return next({ selectedModels, isTextSelection: !!textSelection });
};

declare global {
  namespace BlockSuite {
    interface CommandData {
      selectedModels?: BaseBlockModel[];
      isTextSelection?: boolean;
    }

    interface Commands {
      getSelectedModels: typeof getSelectedModelsCommand;
    }
  }
}
