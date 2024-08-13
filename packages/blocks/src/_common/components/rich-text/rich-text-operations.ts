import type { ListBlockModel, RootBlockModel } from '@blocksuite/affine-model';
import type { EditorHost } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';

import {
  asyncFocusRichText,
  asyncSetInlineRange,
  getInlineEditorByModel,
} from '@blocksuite/affine-components/rich-text';
import {
  isInsideBlockByFlavour,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';
import { type BlockModel, Text } from '@blocksuite/store';

import type { ExtendedModel } from '../../types.js';

import {
  getBlockComponentByModel,
  getDocTitleByEditorHost,
  getNextBlock,
  getPreviousBlock,
} from '../../../_common/utils/query.js';
import { focusTitle } from '../../../_common/utils/selection.js';
import { EMBED_BLOCK_FLAVOUR_LIST } from '../../consts.js';

/**
 * Whether the block supports rendering its children.
 */
function supportsChildren(model: BlockModel): boolean {
  if (
    matchFlavours(model, [
      // 'affine:database',
      'affine:image',
      'affine:divider',
      'affine:code',
    ])
  ) {
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
  const nextSibling = doc.getNext(model);
  if (!parent) {
    return;
  }

  const getProps = ():
    | [
        'affine:list',
        BlockSuite.ModelProps<BlockSuite.BlockModels['affine:list']>,
      ]
    | [
        'affine:paragraph',
        BlockSuite.ModelProps<BlockSuite.BlockModels['affine:paragraph']>,
      ] => {
    const shouldInheritFlavour = matchFlavours(model, ['affine:list']);
    if (shouldInheritFlavour) {
      return [model.flavour, { type: model.type }];
    }
    return ['affine:paragraph', { type: 'text' }];
  };
  const [flavour, blockProps] = getProps();

  if (isInsideBlockByFlavour(doc, model, 'affine:database')) {
    doc.captureSync();
    const index = parent.children.findIndex(child => child.id === model.id);
    let newParent: BlockModel = parent;
    let newBlockIndex = index + 1;
    const childrenLength = parent.children.length;

    if (index === childrenLength - 1 && model.text?.yText.length === 0) {
      if (childrenLength !== 1) {
        doc.deleteBlock(model);
      }

      const nextModel = doc.getNext(newParent);
      if (nextModel && matchFlavours(nextModel, ['affine:paragraph'])) {
        asyncFocusRichText(
          editorHost,
          nextModel.id,
          nextModel.text.length
        )?.catch(console.error);
        return;
      }

      const prevParent = doc.getParent(parent);
      if (!prevParent) return;
      const prevIndex = prevParent.children.findIndex(
        child => child.id === parent.id
      );
      newParent = prevParent;
      newBlockIndex = prevIndex + 1;
    }

    const id = doc.addBlock(flavour, blockProps, newParent, newBlockIndex);
    asyncFocusRichText(editorHost, id)?.catch(console.error);
    return;
  }
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

  // 4. If the target block is a numbered list, update the prefix of next siblings
  if (matchFlavours(model, ['affine:list']) && model.type === 'numbered') {
    let next = nextSibling;
    while (
      next &&
      matchFlavours(next, ['affine:list']) &&
      model.type === 'numbered'
    ) {
      doc.updateBlock(next, {});
      next = doc.getNext(next);
    }
  }

  asyncFocusRichText(editorHost, id)?.catch(console.error);
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
    return asyncFocusRichText(editorHost, id);
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
    const newModel = doc.getBlock(id).model;
    doc.moveBlocks(model.children, newModel);
    return asyncFocusRichText(editorHost, id);
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
  const nextSiblings = doc.getNexts(model);

  doc.captureSync();
  doc.moveBlocks([model], previousSibling);

  // update list prefix
  if (matchFlavours(model, ['affine:list']) && model.type === 'numbered') {
    doc.updateBlock(model, {});
  }
  nextSiblings
    .filter(
      sibling =>
        matchFlavours(sibling, ['affine:list']) && sibling.type === 'numbered'
    )
    .forEach(sibling => {
      doc.updateBlock(sibling, {});
    });

  // update collapsed state
  if (
    matchFlavours(previousSibling, ['affine:list']) &&
    previousSibling.collapsed
  ) {
    doc.updateBlock(previousSibling, {
      collapsed: false,
    } as Partial<ListBlockModel>);
  }

  asyncSetInlineRange(editorHost, model, { index: offset, length: 0 }).catch(
    console.error
  );
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
  const parentNextSiblings = doc.getNexts(parent);
  doc.moveBlocks(nextSiblings, model);
  doc.moveBlocks([model], grandParent, parent, false);

  // update list prefix
  if (matchFlavours(model, ['affine:list']) && model.type === 'numbered') {
    doc.updateBlock(model, {});
  }
  model.children.forEach(child => {
    if (matchFlavours(child, ['affine:list']) && child.type === 'numbered') {
      doc.updateBlock(child, {});
    }
  });
  parentNextSiblings
    .filter(
      sibling =>
        matchFlavours(sibling, ['affine:list']) && sibling.type === 'numbered'
    )
    .forEach(sibling => {
      doc.updateBlock(sibling, {});
    });

  asyncSetInlineRange(editorHost, model, { index: offset, length: 0 }).catch(
    console.error
  );
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

// When deleting at line end of a code block,
// do nothing
function handleCodeBlockForwardDelete(model: ExtendedModel) {
  return matchFlavours(model, ['affine:code']);
}

function handleDatabaseBlockForwardDelete(model: ExtendedModel) {
  const doc = model.doc;
  return isInsideBlockByFlavour(doc, model, 'affine:database');
}

// When deleting at line start of a list block,
// switch it to normal paragraph block.
function handleListBlockBackspace(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  const doc = model.doc;
  if (!matchFlavours(model, ['affine:list'])) return false;

  const parent = doc.getParent(model);
  if (!parent) return false;

  const nextSiblings = doc.getNexts(model);
  const index = parent.children.indexOf(model);
  const blockProps = {
    type: 'text' as const,
    text: model.text?.clone(),
    children: model.children,
  };
  doc.captureSync();
  doc.deleteBlock(model, {
    deleteChildren: false,
  });
  nextSiblings
    .filter(
      sibling =>
        matchFlavours(sibling, ['affine:list']) && sibling.type === 'numbered'
    )
    .forEach(sibling => doc.updateBlock(sibling, {}));

  const id = doc.addBlock('affine:paragraph', blockProps, parent, index);
  asyncFocusRichText(editorHost, id)?.catch(console.error);
  return true;
}

// When deleting at line end of a list block,
// check current block's children and siblings
/**
 * Example:
- Line1  <-(cursor here)
    - Line2
        - Line3
        - Line4
    - Line5
        - Line6
- Line7
    - Line8
- Line9
 */
function handleListBlockForwardDelete(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  if (!matchFlavours(model, ['affine:list'])) return false;
  const doc = model.doc;
  const firstChild = model.firstChild();
  if (firstChild) {
    model.text?.join(firstChild.text as Text);
    const grandChildren = firstChild.children;
    if (grandChildren) {
      doc.moveBlocks(grandChildren, model);
      doc.deleteBlock(firstChild);
      return true;
    } else {
      doc.deleteBlock(firstChild);
      return true;
    }
  } else {
    const nextSibling = doc.getNext(model);
    if (nextSibling) {
      model.text?.join(nextSibling.text as Text);
      if (nextSibling.children) {
        const parent = doc.getParent(nextSibling);
        if (!parent) return false;
        doc.moveBlocks(nextSibling.children, parent, model, false);
        doc.deleteBlock(nextSibling);
        return true;
      } else {
        doc.deleteBlock(nextSibling);
        return true;
      }
    } else {
      const nextBlock = getNextBlock(editorHost, model);
      if (!nextBlock) {
        // do nothing
        return true;
      }
      model.text?.join(nextBlock.text as Text);
      if (nextBlock.children) {
        const parent = doc.getParent(nextBlock);
        if (!parent) return false;
        doc.moveBlocks(nextBlock.children, parent, doc.getParent(model), false);
        doc.deleteBlock(nextBlock);
        return true;
      } else {
        doc.deleteBlock(nextBlock);
        return true;
      }
    }
  }
}

function handleParagraphOrListSibling(
  editorHost: EditorHost,
  model: ExtendedModel,
  previousSibling: ExtendedModel,
  parent: ExtendedModel
) {
  const doc = model.doc;
  if (!matchFlavours(previousSibling, ['affine:paragraph', 'affine:list']))
    return false;

  doc.captureSync();
  const preTextLength = previousSibling.text?.length || 0;
  model.text?.length && previousSibling.text?.join(model.text as Text);
  doc.deleteBlock(model, {
    bringChildrenTo: parent,
  });
  const inlineEditor = getInlineEditorByModel(editorHost, previousSibling);
  inlineEditor?.setInlineRange({
    index: preTextLength,
    length: 0,
  });
  return true;
}

function handleEmbedDividerCodeSibling(
  editorHost: EditorHost,
  model: ExtendedModel,
  previousSibling: ExtendedModel,
  parent: ExtendedModel
) {
  const doc = model.doc;
  if (matchFlavours(previousSibling, ['affine:divider'])) {
    doc.deleteBlock(previousSibling);
    return true;
  }

  if (
    !matchFlavours(previousSibling, [
      'affine:image',
      'affine:code',
      'affine:bookmark',
      'affine:attachment',
      'affine:surface-ref',
    ])
  )
    return false;

  asyncFocusRichText(
    editorHost,
    previousSibling.id,
    previousSibling.text?.yText.length
  ).catch(console.error);
  if (!model.text?.length) {
    doc.captureSync();
    doc.deleteBlock(model, {
      bringChildrenTo: parent,
    });
  }
  return true;
}

function handleNoPreviousSibling(editorHost: EditorHost, model: ExtendedModel) {
  const doc = model.doc;
  const text = model.text;
  const parent = doc.getParent(model);
  if (!parent) return false;
  const titleElement = getDocTitleByEditorHost(
    editorHost
  ) as HTMLTextAreaElement | null;
  // Probably no title, e.g. in edgeless mode
  if (!titleElement) {
    if (
      matchFlavours(parent, ['affine:edgeless-text']) ||
      model.children.length > 0
    ) {
      doc.deleteBlock(model, {
        bringChildrenTo: parent,
      });
      return true;
    }
    return false;
  }

  const rootModel = model.doc.root as RootBlockModel;
  const title = rootModel.title;

  doc.captureSync();
  let textLength = 0;
  if (text) {
    textLength = text.length;
    title.join(text);
  }

  // Preserve at least one block to be able to focus on container click
  if (doc.getNext(model) || model.children.length > 0) {
    const parent = doc.getParent(model);
    if (!parent) return false;
    doc.deleteBlock(model, {
      bringChildrenTo: parent,
    });
  } else {
    text?.clear();
  }
  focusTitle(editorHost, title.length - textLength);
  return true;
}

function handleParagraphDeleteActions(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  const doc = model.doc;
  const parent = doc.getParent(model);
  if (!parent) return false;
  const previousSibling = getPreviousBlock(editorHost, model);
  if (!previousSibling) {
    return handleNoPreviousSibling(editorHost, model);
  } else if (
    matchFlavours(previousSibling, ['affine:paragraph', 'affine:list'])
  ) {
    const modelIndex = parent.children.indexOf(model);
    if (
      (modelIndex === -1 || modelIndex === parent.children.length - 1) &&
      parent.role === 'content'
    )
      return false;
    const lengthBeforeJoin = previousSibling.text?.length ?? 0;
    previousSibling.text?.join(model.text as Text);
    doc.deleteBlock(model, {
      bringChildrenTo: parent,
    });
    asyncSetInlineRange(editorHost, previousSibling, {
      index: lengthBeforeJoin,
      length: 0,
    }).catch(console.error);
    return true;
  } else if (
    matchFlavours(previousSibling, [
      'affine:attachment',
      'affine:bookmark',
      'affine:code',
      'affine:image',
      'affine:divider',
      ...EMBED_BLOCK_FLAVOUR_LIST,
    ])
  ) {
    const previousSiblingElement = getBlockComponentByModel(
      editorHost,
      previousSibling
    );
    if (!previousSiblingElement) return false;
    const selection = editorHost.selection.create('block', {
      blockId: previousSiblingElement.blockId,
    });
    editorHost.selection.setGroup('note', [selection]);

    if (model.text?.length === 0) {
      doc.deleteBlock(model, {
        bringChildrenTo: parent,
      });
    }

    return true;
  } else if (matchFlavours(previousSibling, ['affine:edgeless-text'])) {
    return true;
  }

  // TODO handle in block service
  if (matchFlavours(parent, ['affine:database'])) {
    doc.deleteBlock(model);
    asyncFocusRichText(
      editorHost,
      previousSibling.id,
      previousSibling.text?.yText.length
    ).catch(console.error);
    return true;
  } else if (matchFlavours(parent, ['affine:note'])) {
    return (
      handleParagraphOrListSibling(
        editorHost,
        model,
        previousSibling,
        parent
      ) ||
      handleEmbedDividerCodeSibling(editorHost, model, previousSibling, parent)
    );
  }
  return false;
}

function handleParagraphBlockBackspace(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  const doc = model.doc;
  if (!matchFlavours(model, ['affine:paragraph'])) return false;

  // When deleting at line start of a paragraph block,
  // firstly switch it to normal text, then delete this empty block.
  if (model.type !== 'text') {
    // Try to switch to normal text
    doc.captureSync();
    doc.updateBlock(model, { type: 'text' });
    return true;
  }

  // Before press backspace
  // - line1
  //   - line2
  //   - |aaa
  //   - line3
  //
  // After press backspace
  // - line1
  //   - line2|aaa
  //   - line3
  const isHandled = handleParagraphDeleteActions(editorHost, model);
  if (isHandled) return true;

  // Before press backspace
  // - line1
  //   - line2
  //   - |aaa
  //
  // After press backspace
  // - line1
  //   - line2
  // - |aaa
  handleUnindent(editorHost, model);
  return true;
}

function handleParagraphBlockForwardDelete(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  const doc = model.doc;
  function handleParagraphOrList(
    doc: Doc,
    model: ExtendedModel,
    nextSibling: ExtendedModel | null,
    firstChild: ExtendedModel | null
  ) {
    function handleParagraphOrListSibling(
      doc: Doc,
      model: ExtendedModel,
      nextSibling: ExtendedModel | null
    ) {
      if (
        nextSibling &&
        matchFlavours(nextSibling, ['affine:paragraph', 'affine:list'])
      ) {
        model.text?.join(nextSibling.text as Text);
        if (nextSibling.children) {
          const parent = doc.getParent(nextSibling);
          if (!parent) return false;
          doc.moveBlocks(nextSibling.children, parent, model, false);
          doc.deleteBlock(nextSibling);
          return true;
        } else {
          doc.deleteBlock(nextSibling);
          return true;
        }
      } else {
        const nextBlock = getNextBlock(editorHost, model);
        if (
          !nextBlock ||
          !matchFlavours(nextBlock, ['affine:paragraph', 'affine:list'])
        )
          return false;
        model.text?.join(nextBlock.text as Text);
        if (nextBlock.children) {
          const parent = doc.getParent(nextBlock);
          if (!parent) return false;
          doc.moveBlocks(
            nextBlock.children,
            parent,
            doc.getParent(model),
            false
          );
          doc.deleteBlock(nextBlock);
          return true;
        } else {
          doc.deleteBlock(nextBlock);
          return true;
        }
      }
    }
    function handleParagraphOrListChild(
      doc: Doc,
      model: ExtendedModel,
      firstChild: ExtendedModel | null
    ) {
      if (
        !firstChild ||
        !matchFlavours(firstChild, ['affine:paragraph', 'affine:list'])
      ) {
        return false;
      }
      const grandChildren = firstChild.children;
      model.text?.join(firstChild.text as Text);
      if (grandChildren) {
        doc.moveBlocks(grandChildren, model);
      }
      doc.deleteBlock(firstChild);
      return true;
    }
    const nextBlock = getNextBlock(editorHost, model);
    if (!firstChild && !nextBlock) return true;
    return (
      handleParagraphOrListChild(doc, model, firstChild) ||
      handleParagraphOrListSibling(doc, model, nextSibling)
    );
  }
  function handleEmbedDividerCode(
    nextSibling: ExtendedModel | null,
    firstChild: ExtendedModel | null
  ) {
    function handleEmbedDividerCodeChild(firstChild: ExtendedModel | null) {
      if (
        !firstChild ||
        !matchFlavours(firstChild, [
          'affine:image',
          'affine:divider',
          'affine:code',
        ])
      )
        return false;
      asyncFocusRichText(
        editorHost,
        firstChild.id,
        firstChild.text?.yText.length
      ).catch(console.error);
      return true;
    }
    function handleEmbedDividerCodeSibling(nextSibling: ExtendedModel | null) {
      if (matchFlavours(nextSibling, ['affine:divider'])) {
        const nextSiblingComponent = getBlockComponentByModel(
          editorHost,
          nextSibling
        );
        if (!nextSiblingComponent) return false;
        editorHost.selection.setGroup('note', [
          editorHost.selection.create('block', {
            blockId: nextSiblingComponent.blockId,
          }),
        ]);
        return true;
      }

      if (
        !nextSibling ||
        !matchFlavours(nextSibling, ['affine:image', 'affine:code'])
      )
        return false;
      asyncFocusRichText(
        editorHost,
        nextSibling.id,
        nextSibling.text?.yText.length
      ).catch(console.error);
      return true;
    }
    return (
      handleEmbedDividerCodeChild(firstChild) ||
      handleEmbedDividerCodeSibling(nextSibling)
    );
  }

  if (!matchFlavours(model, ['affine:paragraph'])) return false;

  const parent = doc.getParent(model);
  if (!parent) return false;
  const nextSibling = doc.getNext(model);
  const firstChild = model.firstChild();
  if (matchFlavours(parent, ['affine:database'])) {
    // TODO
    return false;
  } else {
    const ignoreForwardDeleteFlavourList: BlockSuite.Flavour[] = [
      'affine:database',
      'affine:image',
      'affine:code',
      'affine:attachment',
      'affine:bookmark',
      ...EMBED_BLOCK_FLAVOUR_LIST,
    ];

    if (
      nextSibling &&
      matchFlavours(nextSibling, ignoreForwardDeleteFlavourList)
    ) {
      return true;
    }

    return (
      handleParagraphOrList(doc, model, nextSibling, firstChild) ||
      handleEmbedDividerCode(nextSibling, firstChild)
    );
  }
}

export function handleLineStartBackspace(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  if (
    handleListBlockBackspace(editorHost, model) ||
    handleParagraphBlockBackspace(editorHost, model)
  ) {
    return;
  }
}

export function handleLineEndForwardDelete(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  if (
    handleCodeBlockForwardDelete(model) ||
    handleListBlockForwardDelete(editorHost, model) ||
    handleParagraphBlockForwardDelete(editorHost, model)
  ) {
    handleDatabaseBlockForwardDelete(model);
    return;
  }
}
