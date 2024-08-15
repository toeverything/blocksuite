import type {
  ListBlockModel,
  ParagraphBlockModel,
} from '@blocksuite/affine-model';
import type { EditorHost } from '@blocksuite/block-std';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { type BlockModel, Text } from '@blocksuite/store';

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

export function handleBlockEndEnter(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  const doc = model.doc;
  const parent = doc.getParent(model);
  if (!parent) {
    return;
  }

  const getProps = (): [
    'affine:paragraph',
    BlockSuite.ModelProps<ParagraphBlockModel>,
  ] => {
    return ['affine:paragraph', { type: 'text' }];
  };
  const [flavour, blockProps] = getProps();

  const index = parent.children.indexOf(model);
  if (index === -1) {
    return;
  }
  // make adding text block by enter a standalone operation
  doc.captureSync();

  let id: string;

  if (model.children.length > 0) {
    // before:
    // aaa|
    //   bbb
    //
    // after:
    // aaa
    //   |
    //   bbb
    id = doc.addBlock(flavour, blockProps, model, 0);
  } else {
    // before:
    // aaa|
    //
    // after:
    // aaa
    // |
    id = doc.addBlock(flavour, blockProps, parent, index + 1);
  }

  if (model.text) {
    focusTextModel(editorHost.std, id);
  }
}

export function handleBlockSplit(
  editorHost: EditorHost,
  model: ExtendedModel,
  splitIndex: number,
  splitLength: number
) {
  if (!(model.text instanceof Text)) return;

  // On press enter, it may convert symbols from yjs ContentString
  // to yjs ContentFormat. Once it happens, the converted symbol will
  // be deleted and not counted as model.text.yText.length.
  // Example: "`a`[enter]" -> yText[<ContentFormat: Code>, "a", <ContentFormat: Code>]
  // In this case, we should not split the block.
  if (model.text.yText.length < splitIndex + splitLength) return;

  const doc = model.doc;

  const parent = doc.getParent(model);
  if (!parent) return;
  const modelIndex = parent.children.indexOf(model);
  if (modelIndex === -1) return;

  doc.captureSync();
  const right = model.text.split(splitIndex, splitLength);

  if (model.children.length > 0 && splitIndex > 0) {
    const id = doc.addBlock(
      model.flavour as BlockSuite.Flavour,
      {
        text: right,
        type: model.type,
      },
      model,
      0
    );
    return focusTextModel(editorHost.std, id);
  } else {
    const id = doc.addBlock(
      model.flavour as BlockSuite.Flavour,
      {
        text: right,
        type: model.type,
      },
      parent,
      modelIndex + 1
    );
    const newModel = doc.getBlock(id)?.model;
    if (!newModel) {
      return;
    }
    doc.moveBlocks(model.children, newModel);
    return focusTextModel(editorHost.std, id);
  }
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
