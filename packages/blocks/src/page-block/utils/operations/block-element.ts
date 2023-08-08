import type { TextSelection } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import {
  assertExists,
  assertFlavours,
  type BaseBlockModel,
} from '@blocksuite/store';

import { asyncFocusRichText } from '../../../__internal__/utils/common-operations.js';
import { getVirgoByModel } from '../../../__internal__/utils/query.js';
import type { Flavour } from '../../../models.js';
import type { PageBlockComponent } from '../../types.js';
import { onModelTextUpdated } from '../callback.js';
import {
  getBlockSelections,
  getSelectedContentModels,
  getTextSelection,
} from '../selection.js';
import { mergeToCodeBlocks, transformBlock } from './model.js';

/**
 * This file should only contain functions that are used to
 * operate on block elements, which means that this operations
 * will be involved in something about ui like selection reset.
 */

export function updateBlockElementType(
  pageElement: PageBlockComponent,
  blockElements: BlockElement[],
  flavour: Flavour,
  type?: string
) {
  if (blockElements.length === 0) {
    return [];
  }
  const page = pageElement.page;
  const hasSamePage = blockElements.every(block => block.page === page);
  if (!hasSamePage) {
    // page check
    console.error(
      'Not all models have the same page instance, the result for update text type may not be correct',
      blockElements
    );
  }

  page.captureSync();

  const blockModels = blockElements.map(ele => ele.model);

  if (flavour === 'affine:code') {
    const id = mergeToCodeBlocks(page, blockModels);
    const model = page.getBlockById(id);
    if (!model) {
      throw new Error('Failed to get model after merge code block!');
    }
    return [model];
  }
  if (flavour === 'affine:divider') {
    const model = blockModels.at(-1);
    if (!model) {
      return [];
    }
    const parent = page.getParent(model);
    if (!parent) {
      return [];
    }
    const index = parent.children.indexOf(model);
    const nextSibling = page.getNextSibling(model);
    let nextSiblingId = nextSibling?.id as string;
    const id = page.addBlock('affine:divider', {}, parent, index + 1);
    if (!nextSibling) {
      nextSiblingId = page.addBlock('affine:paragraph', {}, parent);
    }
    asyncFocusRichText(page, nextSiblingId);
    const newModel = page.getBlockById(id);
    if (!newModel) {
      throw new Error('Failed to get model after add divider block!');
    }
    return [newModel];
  }

  const newModels: BaseBlockModel[] = [];
  blockModels.forEach(model => {
    assertFlavours(model, ['affine:paragraph', 'affine:list', 'affine:code']);
    if (model.flavour === flavour) {
      page.updateBlock(model, { type });
      newModels.push(model);
      return;
    }
    const newId = transformBlock(model, flavour, type);
    const newModel = page.getBlockById(newId);
    if (!newModel) {
      throw new Error('Failed to get new model after transform block!');
    }
    newModels.push(newModel);
  });

  const firstNewModel = newModels[0];
  const lastNewModel = newModels[newModels.length - 1];

  const allTextUpdated = newModels.map(model => onModelTextUpdated(model));
  const selectionManager = pageElement.root.selectionManager;
  const textSelection = getTextSelection(pageElement);
  const blockSelections = getBlockSelections(pageElement);
  if (textSelection) {
    const newTextSelection = selectionManager.getInstance('text', {
      from: {
        path: textSelection.from.path.slice(0, -1).concat(firstNewModel.id),
        index: textSelection.from.index,
        length: textSelection.from.length,
      },
      to: textSelection.to
        ? {
            path: textSelection.to.path.slice(0, -1).concat(lastNewModel.id),
            index: textSelection.to.index,
            length: textSelection.to.length,
          }
        : null,
    });

    Promise.all(allTextUpdated).then(() => {
      selectionManager.set([newTextSelection]);
    });
    return newModels;
  } else if (blockSelections.length !== 0) {
    if (blockSelections[0].blockId !== firstNewModel.id) {
      blockSelections[0] = selectionManager.getInstance('block', {
        path: blockSelections[0].path.slice(0, -1).concat(firstNewModel.id),
      });
    }
    if (
      blockSelections[blockSelections.length - 1].blockId !== lastNewModel.id
    ) {
      blockSelections[blockSelections.length - 1] =
        selectionManager.getInstance('block', {
          path: blockSelections[blockSelections.length - 1].path
            .slice(0, -1)
            .concat(lastNewModel.id),
        });
    }
    selectionManager.set(blockSelections);
    return newModels;
  }

  return newModels;
}

export function deleteModelsByRange(
  pageElement: PageBlockComponent,
  textSelection?: TextSelection
) {
  if (!textSelection) {
    textSelection = getTextSelection(pageElement) ?? undefined;
  }
  assertExists(textSelection);

  const page = pageElement.page;
  const selectedModels = getSelectedContentModels(pageElement);

  if (selectedModels.length === 0) {
    return null;
  }

  const startModel = selectedModels[0];
  const endModel = selectedModels[selectedModels.length - 1];
  // TODO handle database
  if (!startModel.text || !endModel.text) {
    throw new Error('startModel or endModel does not have text');
  }

  const vEditor = getVirgoByModel(startModel);
  assertExists(vEditor);

  // Only select one block
  if (startModel === endModel) {
    page.captureSync();
    if (textSelection.from.index > 0 && textSelection.isCollapsed()) {
      // startModel.text.delete(blockRange.startOffset - 1, 1);
      // vEditor.setVRange({
      //   index: blockRange.startOffset - 1,
      //   length: 0,
      // });
      return startModel;
    }
    startModel.text.delete(textSelection.from.index, textSelection.from.length);
    vEditor.setVRange({
      index: textSelection.from.index,
      length: 0,
    });
    return startModel;
  }
  page.captureSync();
  startModel.text.delete(textSelection.from.index, textSelection.from.length);
  endModel.text.delete(
    textSelection.to?.index ?? 0,
    textSelection.to?.length ?? 0
  );
  startModel.text.join(endModel.text);
  selectedModels.slice(1).forEach(model => {
    page.deleteBlock(model);
  });

  vEditor.setVRange({
    index: textSelection.from.index,
    length: 0,
  });
  return startModel;
}
