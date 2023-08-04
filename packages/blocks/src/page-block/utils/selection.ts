import { BlockSelection, TextSelection } from '@blocksuite/block-std';
import { assertExists, type BaseBlockModel } from '@blocksuite/store';

import type { PageBlockComponent } from '../types.js';

export function getSelectedContentModels(
  pageComponent: PageBlockComponent
): BaseBlockModel[] {
  const { rangeManager } = pageComponent;
  const selectionManager = pageComponent.root.selectionManager;
  const selections = selectionManager.value;
  const selectedContentBlocks: BaseBlockModel[] = [];

  if (selections.length === 0) {
    return [];
  }

  const textSelection = selections.find(
    selection => selection instanceof TextSelection
  ) as TextSelection | undefined;
  const blockSelections = selections.filter(
    selection => selection instanceof BlockSelection
  ) as BlockSelection[];
  if (textSelection) {
    assertExists(rangeManager);
    const range = rangeManager.value;
    const selectedBlocks = rangeManager
      .getSelectedBlocksIdByRange(range)
      .map(id => {
        const model = pageComponent.page.getBlockById(id);
        assertExists(model);
        return model;
      });
    selectedContentBlocks.push(
      ...selectedBlocks.filter(model => model.role === 'content')
    );
  } else if (blockSelections.length > 0) {
    selectedContentBlocks.push(
      ...blockSelections
        .map(selection => {
          const model = pageComponent.page.getBlockById(selection.blockId);
          assertExists(model);
          return model;
        })
        .filter(model => model.role === 'content')
    );
  } else {
    return [];
  }

  return selectedContentBlocks;
}

export function getTextSelection(
  pageComponent: PageBlockComponent
): TextSelection | null {
  const selectionManager = pageComponent.root.selectionManager;
  const selections = selectionManager.value;

  const textSelection = selections.find(
    selection => selection instanceof TextSelection
  ) as TextSelection | undefined;

  return textSelection ?? null;
}
