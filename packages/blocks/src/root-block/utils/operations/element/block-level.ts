import type { BlockElement } from '@blocksuite/lit';
import { type BlockModel } from '@blocksuite/store';

import { assertFlavours } from '../../../../_common/utils/model.js';
import {
  asyncFocusRichText,
  asyncSetInlineRange,
} from '../../../../_common/utils/selection.js';
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
  const editorHost = blockElements[0].host;
  const doc = blockElements[0].doc;
  const hasSameDoc = blockElements.every(block => block.doc === doc);
  if (!hasSameDoc) {
    // doc check
    console.error(
      'Not all models have the same doc instance, the result for update text type may not be correct',
      blockElements
    );
  }

  doc.captureSync();

  const blockModels = blockElements.map(ele => ele.model);

  if (flavour === 'affine:code') {
    const id = mergeToCodeModel(blockModels);
    const model = doc.getBlockById(id);
    if (!model) {
      throw new Error('Failed to get model after merge code block!');
    }
    asyncSetInlineRange(editorHost, model, {
      index: model.text?.length ?? 0,
      length: 0,
    }).catch(console.error);
    return [model];
  }
  if (flavour === 'affine:divider') {
    const model = blockModels.at(-1);
    if (!model) {
      return [];
    }
    const parent = doc.getParent(model);
    if (!parent) {
      return [];
    }
    const index = parent.children.indexOf(model);
    const nextSibling = doc.getNextSibling(model);
    let nextSiblingId = nextSibling?.id as string;
    const id = doc.addBlock('affine:divider', {}, parent, index + 1);
    if (!nextSibling) {
      nextSiblingId = doc.addBlock('affine:paragraph', {}, parent);
    }
    asyncFocusRichText(editorHost, nextSiblingId)?.catch(console.error);
    const newModel = doc.getBlockById(id);
    if (!newModel) {
      throw new Error('Failed to get model after add divider block!');
    }
    return [newModel];
  }

  console.log('blockModels', blockModels);
  const newModels: BlockModel[] = [];
  blockModels.forEach(model => {
    assertFlavours(model, [
      'affine:paragraph',
      'affine:list',
      'affine:code',
      'affine:callout',
    ]);
    if (model.flavour === flavour) {
      doc.updateBlock(model, { type });
      newModels.push(model);
      return;
    }
    const newId = transformModel(model, flavour, { type });
    const newModel = doc.getBlockById(newId);
    if (!newModel) {
      throw new Error('Failed to get new model after transform block!');
    }
    newModels.push(newModel);
  });

  const firstNewModel = newModels[0];
  const lastNewModel = newModels[newModels.length - 1];

  const allTextUpdated = newModels.map(model =>
    onModelTextUpdated(editorHost, model)
  );
  const selectionManager = editorHost.selection;
  const textSelection = selectionManager.find('text');
  const blockSelections = selectionManager.filter('block');

  if (textSelection) {
    const newTextSelection = selectionManager.create('text', {
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

    Promise.all(allTextUpdated)
      .then(() => {
        selectionManager.setGroup('note', [newTextSelection]);
      })
      .catch(console.error);
    return newModels;
  }

  if (blockSelections.length !== 0) {
    requestAnimationFrame(() => {
      const selections = newModels.map(model => {
        return selectionManager.create('block', {
          path: blockSelections[0].path.slice(0, -1).concat(model.id),
        });
      });

      selectionManager.setGroup('note', selections);
    });
    return newModels;
  }

  return newModels;
}
