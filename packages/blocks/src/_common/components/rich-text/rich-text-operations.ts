import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { type BaseBlockModel } from '@blocksuite/store';
import { Text } from '@blocksuite/store';

import type { BlockModelProps } from '../../../_common/utils/model.js';
import {
  isInsideBlockByFlavour,
  matchFlavours,
} from '../../../_common/utils/model.js';
import {
  getInlineEditorByModel,
  getModelByElement,
  getNextBlock,
  getPreviousBlock,
} from '../../../_common/utils/query.js';
import {
  asyncFocusRichText,
  asyncSetInlineRange,
  focusBlockByModel,
  focusTitle,
} from '../../../_common/utils/selection.js';
import type { ListBlockModel } from '../../../list-block/index.js';
import type { PageBlockModel } from '../../../page-block/index.js';
import type { ExtendedModel } from '../../types.js';

/**
 * Whether the block supports rendering its children.
 */
function supportsChildren(model: BaseBlockModel): boolean {
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

export function handleBlockEndEnter(page: Page, model: ExtendedModel) {
  const parent = page.getParent(model);
  const nextSibling = page.getNextSibling(model);
  if (!parent) {
    return;
  }

  const getProps = ():
    | ['affine:list', Partial<BlockModelProps['affine:list']>]
    | ['affine:paragraph', Partial<BlockModelProps['affine:paragraph']>] => {
    const shouldInheritFlavour = matchFlavours(model, ['affine:list']);
    if (shouldInheritFlavour) {
      return [model.flavour, { type: model.type }];
    }
    return ['affine:paragraph', { type: 'text' }];
  };
  const [flavour, blockProps] = getProps();

  if (isInsideBlockByFlavour(page, model, 'affine:database')) {
    page.captureSync();
    const index = parent.children.findIndex(child => child.id === model.id);
    let newParent: BaseBlockModel = parent;
    let newBlockIndex = index + 1;
    const childrenLength = parent.children.length;

    if (index === childrenLength - 1 && model.text?.yText.length === 0) {
      if (childrenLength !== 1) {
        page.deleteBlock(model);
      }

      const nextModel = page.getNextSibling(newParent);
      if (nextModel && matchFlavours(nextModel, ['affine:paragraph'])) {
        asyncFocusRichText(page, nextModel.id, {
          index: nextModel.text.yText.length,
          length: 0,
        })?.catch(console.error);
        return;
      }

      const prevParent = page.getParent(parent);
      if (!prevParent) return;
      const prevIndex = prevParent.children.findIndex(
        child => child.id === parent.id
      );
      newParent = prevParent;
      newBlockIndex = prevIndex + 1;
    }

    const id = page.addBlock(flavour, blockProps, newParent, newBlockIndex);
    asyncFocusRichText(page, id)?.catch(console.error);
    return;
  }
  const index = parent.children.indexOf(model);
  if (index === -1) {
    return;
  }
  // make adding text block by enter a standalone operation
  page.captureSync();

  // before press enter:
  // aaa|
  //   bbb
  //
  // after press enter:
  // aaa
  // |
  //   bbb
  const id = page.addBlock(flavour, blockProps, parent, index + 1);
  const newModel = page.getBlockById(id);
  assertExists(newModel);
  page.moveBlocks(model.children, newModel);

  // 4. If the target block is a numbered list, update the prefix of next siblings
  if (matchFlavours(model, ['affine:list']) && model.type === 'numbered') {
    let next = nextSibling;
    while (
      next &&
      matchFlavours(next, ['affine:list']) &&
      model.type === 'numbered'
    ) {
      page.updateBlock(next, {});
      next = page.getNextSibling(next);
    }
  }

  asyncFocusRichText(page, id)?.catch(console.error);
}

export function handleBlockSplit(
  page: Page,
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

  const parent = page.getParent(model);
  if (!parent) return;

  page.captureSync();
  const right = model.text.split(splitIndex, splitLength);

  const newParent = parent;
  const newBlockIndex = newParent.children.indexOf(model) + 1;
  const children = [...model.children];
  page.updateBlock(model, { children: [] });
  const id = page.addBlock(
    model.flavour,
    {
      text: right,
      type: model.type,
      children,
    },
    newParent,
    newBlockIndex
  );
  return asyncFocusRichText(page, id);
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
export function handleIndent(page: Page, model: ExtendedModel, offset = 0) {
  const previousSibling = page.getPreviousSibling(model);
  if (!previousSibling || !supportsChildren(previousSibling)) {
    // Bottom, can not indent, do nothing
    return;
  }
  const nextSiblings = page.getNextSiblings(model);

  page.captureSync();
  page.moveBlocks([model], previousSibling);

  // update list prefix
  if (matchFlavours(model, ['affine:list']) && model.type === 'numbered') {
    page.updateBlock(model, {});
  }
  nextSiblings
    .filter(
      sibling =>
        matchFlavours(sibling, ['affine:list']) && sibling.type === 'numbered'
    )
    .forEach(sibling => {
      page.updateBlock(sibling, {});
    });

  // update collapsed state
  if (
    matchFlavours(previousSibling, ['affine:list']) &&
    previousSibling.collapsed
  ) {
    page.updateBlock(previousSibling, {
      collapsed: false,
    } as Partial<ListBlockModel>);
  }

  asyncSetInlineRange(model, { index: offset, length: 0 }).catch(console.error);
}

export function handleMultiBlockIndent(page: Page, models: BaseBlockModel[]) {
  if (!models.length) return;

  // Find the first model that can be indented
  let firstIndentIndex = -1;
  let previousSibling: BaseBlockModel | null = null;
  for (let i = 0; i < models.length; i++) {
    previousSibling = page.getPreviousSibling(models[i]);
    if (previousSibling && supportsChildren(previousSibling)) {
      firstIndentIndex = i;
      break;
    }
  }

  // No model can be indented
  if (firstIndentIndex === -1) return;

  page.captureSync();
  // Models waiting to be indented
  const indentModels = models.slice(firstIndentIndex);
  indentModels.forEach(model => {
    const parent = page.getParent(model);
    assertExists(parent);
    // Only indent the model which parent is not in the `indentModels`
    // When parent is in the `indentModels`, it means the parent has been indented
    // And the model should be indented with its parent
    if (!indentModels.includes(parent)) {
      handleIndent(page, model);
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
export function handleUnindent(page: Page, model: ExtendedModel, offset = 0) {
  const parent = page.getParent(model);
  if (!parent || parent.role !== 'content') {
    // Top most, can not unindent, do nothing
    return;
  }

  const grandParent = page.getParent(parent);
  if (!grandParent) return;
  page.captureSync();

  const nextSiblings = page.getNextSiblings(model);
  const parentNextSiblings = page.getNextSiblings(parent);
  page.moveBlocks(nextSiblings, model);
  page.moveBlocks([model], grandParent, parent, false);

  // update list prefix
  if (matchFlavours(model, ['affine:list']) && model.type === 'numbered') {
    page.updateBlock(model, {});
  }
  model.children.forEach(child => {
    if (matchFlavours(child, ['affine:list']) && child.type === 'numbered') {
      page.updateBlock(child, {});
    }
  });
  parentNextSiblings
    .filter(
      sibling =>
        matchFlavours(sibling, ['affine:list']) && sibling.type === 'numbered'
    )
    .forEach(sibling => {
      page.updateBlock(sibling, {});
    });

  asyncSetInlineRange(model, { index: offset, length: 0 }).catch(console.error);
}

export function handleMultiBlockOutdent(page: Page, models: BaseBlockModel[]) {
  if (!models.length) return;

  // Find the first model that can be unindented
  let firstOutdentIndex = -1;
  let firstParent: BaseBlockModel | null;
  for (let i = 0; i < models.length; i++) {
    firstParent = page.getParent(models[i]);
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
    const parent = page.getParent(model);
    assertExists(parent);
    if (!outdentModels.includes(parent)) {
      handleUnindent(page, model);
    }
  }
}

export function handleRemoveAllIndent(
  page: Page,
  model: ExtendedModel,
  offset = 0
) {
  let parent = page.getParent(model);
  while (parent && !matchFlavours(parent, ['affine:note'])) {
    handleUnindent(page, model, offset);
    parent = page.getParent(model);
  }
}

export function handleRemoveAllIndentForMultiBlocks(
  page: Page,
  models: BaseBlockModel[]
) {
  for (let i = models.length - 1; i >= 0; i--) {
    const model = models[i];
    const parent = page.getParent(model);
    assertExists(parent);
    if (!matchFlavours(parent, ['affine:note'])) {
      handleRemoveAllIndent(page, model);
    }
  }
}

// When deleting at line end of a code block,
// do nothing
function handleCodeBlockForwardDelete(model: ExtendedModel) {
  if (!matchFlavours(model, ['affine:code'])) return false;
  return true;
}

function handleDatabaseBlockForwardDelete(model: ExtendedModel) {
  const page = model.page;
  if (!isInsideBlockByFlavour(page, model, 'affine:database')) return false;

  return true;
}

// When deleting at line start of a list block,
// switch it to normal paragraph block.
function handleListBlockBackspace(model: ExtendedModel) {
  const page = model.page;
  if (!matchFlavours(model, ['affine:list'])) return false;

  const parent = page.getParent(model);
  if (!parent) return false;

  const nextSiblings = page.getNextSiblings(model);
  const index = parent.children.indexOf(model);
  const blockProps = {
    type: 'text' as const,
    text: model.text?.clone(),
    children: model.children,
  };
  page.captureSync();
  page.deleteBlock(model, {
    deleteChildren: false,
  });
  nextSiblings
    .filter(
      sibling =>
        matchFlavours(sibling, ['affine:list']) && sibling.type === 'numbered'
    )
    .forEach(sibling => page.updateBlock(sibling, {}));

  const id = page.addBlock('affine:paragraph', blockProps, parent, index);
  asyncFocusRichText(page, id)?.catch(console.error);
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
  const page = model.page;
  const firstChild = model.firstChild();
  if (firstChild) {
    model.text?.join(firstChild.text as Text);
    const grandChildren = firstChild.children;
    if (grandChildren) {
      page.moveBlocks(grandChildren, model);
      page.deleteBlock(firstChild);
      return true;
    } else {
      page.deleteBlock(firstChild);
      return true;
    }
  } else {
    const nextSibling = page.getNextSibling(model);
    if (nextSibling) {
      model.text?.join(nextSibling.text as Text);
      if (nextSibling.children) {
        const parent = page.getParent(nextSibling);
        if (!parent) return false;
        page.moveBlocks(nextSibling.children, parent, model, false);
        page.deleteBlock(nextSibling);
        return true;
      } else {
        page.deleteBlock(nextSibling);
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
        const parent = page.getParent(nextBlock);
        if (!parent) return false;
        page.moveBlocks(
          nextBlock.children,
          parent,
          page.getParent(model),
          false
        );
        page.deleteBlock(nextBlock);
        return true;
      } else {
        page.deleteBlock(nextBlock);
        return true;
      }
    }
  }
}

function handleParagraphOrListSibling(
  page: Page,
  model: ExtendedModel,
  previousSibling: ExtendedModel,
  parent: ExtendedModel
) {
  if (!matchFlavours(previousSibling, ['affine:paragraph', 'affine:list']))
    return false;

  page.captureSync();
  const preTextLength = previousSibling.text?.length || 0;
  model.text?.length && previousSibling.text?.join(model.text as Text);
  page.deleteBlock(model, {
    bringChildrenTo: parent,
  });
  const inlineEditor = getInlineEditorByModel(previousSibling);
  inlineEditor?.setInlineRange({
    index: preTextLength,
    length: 0,
  });
  return true;
}

function handleEmbedDividerCodeSibling(
  page: Page,
  model: ExtendedModel,
  previousSibling: ExtendedModel,
  parent: ExtendedModel
) {
  if (matchFlavours(previousSibling, ['affine:divider'])) {
    page.deleteBlock(previousSibling);
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

  focusBlockByModel(previousSibling);
  if (!model.text?.length) {
    page.captureSync();
    page.deleteBlock(model, {
      bringChildrenTo: parent,
    });
  }
  return true;
}

function handleNoPreviousSibling(editorHost: EditorHost, model: ExtendedModel) {
  const page = model.page;
  const text = model.text;
  const titleElement = document.querySelector(
    '.affine-doc-page-block-title'
  ) as HTMLTextAreaElement | null;
  // Probably no title, e.g. in edgeless mode
  if (!titleElement) return false;

  const pageModel = getModelByElement(titleElement) as PageBlockModel;
  const title = pageModel.title;

  page.captureSync();
  let textLength = 0;
  if (text) {
    textLength = text.length;
    title.join(text);
  }

  // Preserve at least one block to be able to focus on container click
  if (page.getNextSibling(model) || model.children.length > 0) {
    const parent = page.getParent(model);
    assertExists(parent);
    page.deleteBlock(model, {
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
  const page = model.page;
  const parent = page.getParent(model);
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
    page.deleteBlock(model, {
      bringChildrenTo: parent,
    });
    asyncSetInlineRange(previousSibling, {
      index: lengthBeforeJoin,
      length: 0,
    }).catch(console.error);
    return true;
  }

  // TODO handle in block service
  if (matchFlavours(parent, ['affine:database'])) {
    page.deleteBlock(model);
    focusBlockByModel(previousSibling);
    return true;
  } else if (matchFlavours(parent, ['affine:note'])) {
    return (
      handleParagraphOrListSibling(page, model, previousSibling, parent) ||
      handleEmbedDividerCodeSibling(page, model, previousSibling, parent) ||
      handleUnknownBlockBackspace(previousSibling)
    );
  }
  return false;
}

function handleParagraphBlockBackspace(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  const page = model.page;
  if (!matchFlavours(model, ['affine:paragraph'])) return false;

  // When deleting at line start of a paragraph block,
  // firstly switch it to normal text, then delete this empty block.
  if (model.type !== 'text') {
    // Try to switch to normal text
    page.captureSync();
    page.updateBlock(model, { type: 'text' });
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
  handleUnindent(page, model);
  return true;
}

function handleParagraphBlockForwardDelete(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  const page = model.page;
  function handleParagraphOrList(
    page: Page,
    model: ExtendedModel,
    nextSibling: ExtendedModel | null,
    firstChild: ExtendedModel | null
  ) {
    function handleParagraphOrListSibling(
      page: Page,
      model: ExtendedModel,
      nextSibling: ExtendedModel | null
    ) {
      if (
        nextSibling &&
        matchFlavours(nextSibling, ['affine:paragraph', 'affine:list'])
      ) {
        model.text?.join(nextSibling.text as Text);
        if (nextSibling.children) {
          const parent = page.getParent(nextSibling);
          if (!parent) return false;
          page.moveBlocks(nextSibling.children, parent, model, false);
          page.deleteBlock(nextSibling);
          return true;
        } else {
          page.deleteBlock(nextSibling);
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
          const parent = page.getParent(nextBlock);
          if (!parent) return false;
          page.moveBlocks(
            nextBlock.children,
            parent,
            page.getParent(model),
            false
          );
          page.deleteBlock(nextBlock);
          return true;
        } else {
          page.deleteBlock(nextBlock);
          return true;
        }
      }
    }
    function handleParagraphOrListChild(
      page: Page,
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
        page.moveBlocks(grandChildren, model);
      }
      page.deleteBlock(firstChild);
      return true;
    }
    const nextBlock = getNextBlock(editorHost, model);
    if (!firstChild && !nextBlock) return true;
    return (
      handleParagraphOrListChild(page, model, firstChild) ||
      handleParagraphOrListSibling(page, model, nextSibling)
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
      focusBlockByModel(firstChild);
      return true;
    }
    function handleEmbedDividerCodeSibling(nextSibling: ExtendedModel | null) {
      if (matchFlavours(nextSibling, ['affine:divider'])) {
        page.deleteBlock(nextSibling);
        return true;
      }

      if (
        !nextSibling ||
        !matchFlavours(nextSibling, ['affine:image', 'affine:code'])
      )
        return false;
      focusBlockByModel(nextSibling);
      return true;
    }
    return (
      handleEmbedDividerCodeChild(firstChild) ||
      handleEmbedDividerCodeSibling(nextSibling)
    );
  }

  if (!matchFlavours(model, ['affine:paragraph'])) return false;

  const parent = page.getParent(model);
  if (!parent) return false;
  const nextSibling = page.getNextSibling(model);
  const firstChild = model.firstChild();
  if (matchFlavours(parent, ['affine:database'])) {
    // TODO
    return false;
  } else {
    return (
      handleParagraphOrList(page, model, nextSibling, firstChild) ||
      handleEmbedDividerCode(nextSibling, firstChild)
    );
  }
}

function handleUnknownBlockBackspace(model: ExtendedModel) {
  throw new Error(
    'Failed to handle backspace! Unknown block flavours! flavour:' +
      model.flavour
  );
}

function handleUnknownBlockForwardDelete(model: ExtendedModel) {
  throw new Error(
    'Failed to handle forwarddelete! Unknown block flavours! flavour:' +
      model.flavour
  );
}

export function handleLineStartBackspace(
  editorHost: EditorHost,
  model: ExtendedModel
) {
  if (
    handleListBlockBackspace(model) ||
    handleParagraphBlockBackspace(editorHost, model)
  ) {
    return;
  }

  handleUnknownBlockBackspace(model);
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
  handleUnknownBlockForwardDelete(model);
}
