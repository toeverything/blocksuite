import type { ListBlockModel } from '@blocksuite/affine-model';
import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';

import type { ExtendedModel } from '../../types.js';

/**
 * Whether the block supports rendering its children.
 */
function supportsChildren(model: BlockModel): boolean {
  if (matchFlavours(model, ['affine:image', 'affine:divider', 'affine:code'])) {
    return false;
  }
  if (
    matchFlavours(model, ['affine:paragraph']) &&
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'quote'].includes(model.type ?? '')
  ) {
    return false;
  }
  return true;
}

/**
 * @example
 * before unindent:
 * - aaa
 *   - bbb
 * - ccc|
 *   - ddd
 *   - eee
 *
 * after unindent:
 * - aaa
 *   - bbb
 *   - ccc|
 *     - ddd
 *     - eee
 */
export function handleIndent(
  editorHost: EditorHost,
  model: ExtendedModel,
  offset = 0
) {
  const doc = model.doc;
  const previousSibling = doc.getPrev(model);
  if (doc.readonly || !previousSibling || !supportsChildren(previousSibling)) {
    // Bottom, can not indent, do nothing
    return;
  }
  doc.captureSync();
  doc.moveBlocks([model], previousSibling);

  // update collapsed state
  if (
    matchFlavours(previousSibling, ['affine:list']) &&
    previousSibling.collapsed
  ) {
    doc.updateBlock(previousSibling, {
      collapsed: false,
    } as Partial<ListBlockModel>);
  }

  if (model.text) {
    focusTextModel(editorHost.std, model.id, offset);
  }
}

export function handleMultiBlockIndent(
  editorHost: EditorHost,
  models: BlockModel[]
) {
  if (!models.length) return;

  const doc = models[0].doc;

  // Find the first model that can be indented
  let firstIndentIndex = -1;
  let previousSibling: BlockModel | null = null;
  for (let i = 0; i < models.length; i++) {
    previousSibling = doc.getPrev(models[i]);
    if (previousSibling && supportsChildren(previousSibling)) {
      firstIndentIndex = i;
      break;
    }
  }

  // No model can be indented
  if (firstIndentIndex === -1) return;

  doc.captureSync();
  // Models waiting to be indented
  const indentModels = models.slice(firstIndentIndex);
  indentModels.forEach(model => {
    const parent = doc.getParent(model);
    if (!parent) return;
    // Only indent the model which parent is not in the `indentModels`
    // When parent is in the `indentModels`, it means the parent has been indented
    // And the model should be indented with its parent
    if (!indentModels.includes(parent)) {
      handleIndent(editorHost, model);
    }
  });
}

/**
 * @example
 * before unindent:
 * - aaa
 *   - bbb
 *   - ccc|
 *     - ddd
 *   - eee
 *
 * after unindent:
 * - aaa
 *   - bbb
 * - ccc|
 *   - ddd
 *   - eee
 */
export function handleUnindent(
  editorHost: EditorHost,
  model: ExtendedModel,
  offset = 0
) {
  const doc = model.doc;
  const parent = doc.getParent(model);
  if (doc.readonly || !parent || parent.role !== 'content') {
    // Top most, can not unindent, do nothing
    return;
  }

  const grandParent = doc.getParent(parent);
  if (!grandParent) return;
  doc.captureSync();

  const nextSiblings = doc.getNexts(model);
  doc.moveBlocks(nextSiblings, model);
  doc.moveBlocks([model], grandParent, parent, false);

  if (model.text) {
    focusTextModel(editorHost.std, model.id, offset);
  }
}

export function handleMultiBlockOutdent(
  editorHost: EditorHost,
  models: BlockModel[]
) {
  if (!models.length) return;
  const doc = models[0].doc;

  // Find the first model that can be unindented
  let firstOutdentIndex = -1;
  let firstParent: BlockModel | null;
  for (let i = 0; i < models.length; i++) {
    firstParent = doc.getParent(models[i]);
    if (firstParent && !matchFlavours(firstParent, ['affine:note'])) {
      firstOutdentIndex = i;
      break;
    }
  }

  // Find all the models that can be unindented
  const outdentModels = models.slice(firstOutdentIndex);
  // Form bottom to top
  // Only outdent the models which parent is not in the outdentModels
  // When parent is in the outdentModels
  // It means that children will be unindented with their parent
  for (let i = outdentModels.length - 1; i >= 0; i--) {
    const model = outdentModels[i];
    const parent = doc.getParent(model);
    if (parent && !outdentModels.includes(parent)) {
      handleUnindent(editorHost, model);
    }
  }
}

export function handleRemoveAllIndent(
  editorHost: EditorHost,
  model: ExtendedModel,
  offset = 0
) {
  const doc = model.doc;
  let parent = doc.getParent(model);
  while (parent && !matchFlavours(parent, ['affine:note'])) {
    handleUnindent(editorHost, model, offset);
    parent = doc.getParent(model);
  }
}

export function handleRemoveAllIndentForMultiBlocks(
  editorHost: EditorHost,
  models: BlockModel[]
) {
  if (!models.length) return;
  const doc = models[0].doc;
  for (let i = models.length - 1; i >= 0; i--) {
    const model = models[i];
    const parent = doc.getParent(model);
    if (parent && !matchFlavours(parent, ['affine:note'])) {
      handleRemoveAllIndent(editorHost, model);
    }
  }
}
