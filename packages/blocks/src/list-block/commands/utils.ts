import type { BlockModel, Doc } from '@blocksuite/store';

import type { ListBlockModel } from '../list-model.js';

import { matchFlavours } from '../../_common/utils/model.js';

/**
 * Pass in a list model, and this function will look forward to find continuous sibling numbered lists,
 * typically used for updating list numbers. The result not contains the list passed in.
 */
export function getNextContinuousNumberedLists(
  doc: Doc,
  modelOrId: BlockModel | string
): ListBlockModel[] {
  const model =
    typeof modelOrId === 'string' ? doc.getBlock(modelOrId).model : modelOrId;
  const parent = doc.getParent(model);
  if (!parent) return [];
  const modelIndex = parent.children.indexOf(model);
  if (modelIndex === -1) return [];

  const firstNotNumberedListIndex = parent.children.findIndex(
    (model, i) =>
      i > modelIndex &&
      (!matchFlavours(model, ['affine:list']) || model.type !== 'numbered')
  );
  const newContinuousLists = parent.children.slice(
    modelIndex + 1,
    firstNotNumberedListIndex === -1 ? undefined : firstNotNumberedListIndex
  );
  if (
    !newContinuousLists.every(
      model =>
        matchFlavours(model, ['affine:list']) && model.type === 'numbered'
    )
  )
    return [];

  return newContinuousLists as ListBlockModel[];
}

/**
 * correct target is a numbered list, which is divided into two steps:
 * 1. check if there is a numbered list before the target list. If so, adjust the order of the target list
 *    to the order of the previous list plus 1
 * 2. find continuous lists starting from the target list and keep their order continuous
 */
export function correctNumberedListsOrderToPrev(
  doc: Doc,
  modelOrId: BlockModel | string,
  transact = true
) {
  const model =
    typeof modelOrId === 'string' ? doc.getBlock(modelOrId).model : modelOrId;

  if (
    !matchFlavours(model, ['affine:list']) ||
    model.type$.value !== 'numbered'
  ) {
    return;
  }

  const fn = () => {
    // step 1
    const previousSibling = doc.getPrev(model);
    if (
      previousSibling &&
      matchFlavours(previousSibling, ['affine:list']) &&
      previousSibling.type === 'numbered'
    ) {
      if (!previousSibling.order) previousSibling.order = 1;
      model.order = previousSibling.order + 1;
    }

    if (!model.order) model.order = 1;

    // step 2
    let base = model.order + 1;
    const continuousNumberedLists = getNextContinuousNumberedLists(doc, model);
    continuousNumberedLists.forEach(list => {
      list.order = base;
      base++;
    });
  };

  if (transact) {
    doc.transact(fn);
  } else {
    fn();
  }
}

export function correctListOrder(doc: Doc, model: ListBlockModel) {
  // old numbered list has no order
  if (model.type === 'numbered' && !Number.isInteger(model.order)) {
    correctNumberedListsOrderToPrev(doc, model, false);
  }
  // if list is not numbered, order should be null
  if (model.type !== 'numbered') {
    model.order = null;
  }
}
