import { assertFlavours } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import { type BaseBlockModel } from '@blocksuite/store';

import { asyncFocusRichText } from '../../../../__internal__/utils/common-operations.js';
import type { Flavour } from '../../../../models.js';
import { onModelTextUpdated } from '../../callback.js';
import { mergeToCodeModel, transformModel } from '../model.js';

export function updateBlockElementType(
  blockElements: BlockElement[],
  flavour: Flavour,
  type?: string
) {
  if (blockElements.length === 0) {
    return [];
  }
  const root = blockElements[0].root;
  const page = blockElements[0].page;
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
    const id = mergeToCodeModel(blockModels);
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
    const newId = transformModel(model, flavour, type);
    const newModel = page.getBlockById(newId);
    if (!newModel) {
      throw new Error('Failed to get new model after transform block!');
    }
    newModels.push(newModel);
  });

  const firstNewModel = newModels[0];
  const lastNewModel = newModels[newModels.length - 1];

  const allTextUpdated = newModels.map(model => onModelTextUpdated(model));
  const selectionManager = root.selectionManager;
  const textSelection = selectionManager.find('text');
  const blockSelections = selectionManager.filter('block');

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
      selectionManager.setGroup('note', [newTextSelection]);
    });
    return newModels;
  }

  if (blockSelections.length !== 0) {
    requestAnimationFrame(() => {
      const selections = newModels.map(model => {
        return selectionManager.getInstance('block', {
          path: blockSelections[0].path.slice(0, -1).concat(model.id),
        });
      });

      selectionManager.setGroup('note', selections);
    });
    return newModels;
  }

  return newModels;
}
