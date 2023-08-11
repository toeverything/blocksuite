import type { TextSelection } from '@blocksuite/block-std';
import type { BlockSelection } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import { assertExists, type BaseBlockModel } from '@blocksuite/store';

import type { PageBlockComponent } from '../types.js';

export function getSelectedContentModels(
  pageElement: PageBlockComponent
): BaseBlockModel[] {
  const { rangeManager } = pageElement;
  const selectionManager = pageElement.root.selectionManager;
  const selections = selectionManager.value;

  if (selections.length === 0) {
    return [];
  }

  const textSelection = selectionManager.find('text');
  if (textSelection) {
    assertExists(rangeManager);
    const range = rangeManager.value;
    const selectedBlocks = rangeManager
      .getSelectedBlocksIdByRange(range)
      .flatMap(id => {
        const model = pageElement.page.getBlockById(id);
        // model can be null if the block is deleted
        return model ?? [];
      });

    return selectedBlocks.filter(model => model.role === 'content');
  }

  const blockSelections = selectionManager.filter('block');
  if (blockSelections.length > 0) {
    return blockSelections
      .map(selection => {
        const model = pageElement.page.getBlockById(selection.blockId);
        assertExists(model);
        return model;
      })
      .filter(model => model.role === 'content');
  }

  return [];
}

export function getSelectedContentBlockElements(
  pageElement: PageBlockComponent
): BlockElement[] {
  const { rangeManager } = pageElement;
  assertExists(rangeManager);
  const range = rangeManager.value;
  const selectedBlockElements =
    rangeManager.getSelectedBlockElementsByRange(range);
  return selectedBlockElements.filter(el => el.model.role === 'content');
}

export function getTextSelection(
  blockElement: BlockElement
): TextSelection | null {
  return blockElement.root.selectionManager.find('text') ?? null;
}

export function getBlockSelections(
  blockElement: BlockElement
): BlockSelection[] {
  return blockElement.root.selectionManager.filter('block');
}
