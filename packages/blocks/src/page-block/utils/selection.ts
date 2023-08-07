import { BlockSelection, TextSelection } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import { assertExists, type BaseBlockModel } from '@blocksuite/store';

import type { PageBlockComponent } from '../types.js';

export function getSelectedContentModels(
  pageElement: PageBlockComponent
): BaseBlockModel[] {
  const { rangeManager } = pageElement;
  const selectionManager = pageElement.root.selectionManager;
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
        const model = pageElement.page.getBlockById(id);
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
          const model = pageElement.page.getBlockById(selection.blockId);
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
  pageElement: PageBlockComponent
): TextSelection | null {
  const selectionManager = pageElement.root.selectionManager;
  const selections = selectionManager.value;

  const textSelection = selections.find(
    selection => selection instanceof TextSelection
  ) as TextSelection | undefined;

  return textSelection ?? null;
}

export function getBlockSelections(
  pageElement: PageBlockComponent
): BlockSelection[] {
  const selectionManager = pageElement.root.selectionManager;
  const selections = selectionManager.value;

  const blockSelections = selections.filter(
    selection => selection instanceof BlockSelection
  );
  return blockSelections;
}
