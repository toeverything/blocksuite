import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Text } from '@blocksuite/store';

import { supportsChildren } from '../../__internal__/utils/common.js';
import {
  asyncFocusRichText,
  asyncSetVRange,
} from '../../__internal__/utils/common-operations.js';
import type { BlockModelProps } from '../../__internal__/utils/model.js';
import {
  isInsideBlockByFlavour,
  matchFlavours,
} from '../../__internal__/utils/model.js';
import {
  getModelByElement,
  getNextBlock,
  getPreviousBlock,
  getVirgoByModel,
} from '../../__internal__/utils/query.js';
import {
  focusBlockByModel,
  focusTitle,
} from '../../__internal__/utils/selection.js';
import type { ExtendedModel } from '../../__internal__/utils/types.js';
import type { ListBlockModel, PageBlockModel } from '../../models.js';

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
        });
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
    asyncFocusRichText(page, id);
    return;
  }
  const index = parent.children.indexOf(model);
  if (index === -1) {
    return;
  }
  // make adding text block by enter a standalone operation
  page.captureSync();

  const id = !model.children.length
    ? page.addBlock(flavour, blockProps, parent, index + 1)
    : // If the block has children, insert a new block as the first child
      page.addBlock(flavour, blockProps, model, 0);

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

  asyncFocusRichText(page, id);
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
 * Move down
 * @example
 * ```
 * [ ]
 *  └─ [ ]
 * [x]     <- tab
 *  └─ [ ]
 *
 * ↓
 *
 * [ ]
 *  ├─ [ ]
 *  ├─ [x] <-
 *  └─ [ ]
 * ```
 */
export function handleIndent(page: Page, model: ExtendedModel, offset = 0) {
  const previousSibling = page.getPreviousSibling(model);
  const nextSibling = page.getNextSibling(model);
  if (!previousSibling || !supportsChildren(previousSibling)) {
    // Bottom, can not indent, do nothing
    return;
  }

  const parent = page.getParent(model);
  if (!parent) return;
  page.captureSync();

  // 1. backup target block children and remove them from target block
  const children = model.children;
  page.updateBlock(model, {
    children: [],
  });

  // 2. remove target block from parent block
  page.updateBlock(parent, {
    children: parent.children.filter(child => child.id !== model.id),
  });

  // 3. append target block and children to previous sibling block
  page.updateBlock(previousSibling, {
    children: [...previousSibling.children, model, ...children],
  });

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

  // 5. If parent is collapsed, expand it
  const newParent = previousSibling;
  if (matchFlavours(newParent, ['affine:list']) && newParent.collapsed) {
    page.updateBlock(newParent, {
      collapsed: false,
    } as Partial<ListBlockModel>);
  }

  asyncSetVRange(model, { index: offset, length: 0 });
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
      previousSibling = page.getPreviousSibling(model);
      // If previous sibling is not found or does not support children
      // Handle next model
      if (!previousSibling || !supportsChildren(previousSibling)) {
        return;
      }
      // If previous sibling is found and supports children, indent the model by following steps
      // 1. Remove model from parent
      const remainingChildren = parent.children.filter(
        child => child.id !== model.id
      );
      page.updateBlock(parent, {
        children: remainingChildren,
      });
      // 2. Add model to previous sibling
      page.updateBlock(previousSibling as BaseBlockModel, {
        children: [...(previousSibling as BaseBlockModel).children, model],
      });

      asyncSetVRange(model, { index: 0, length: 0 });
    }
  });
}

/**
 * Move up
 * @example
 * ```
 * [ ]
 *  ├─ [ ]
 *  ├─ [x] <- shift + tab
 *  └─ [ ]
 *
 * ↓
 *
 * [ ]
 *  └─ [ ]
 * [x]     <-
 *  └─ [ ]
 * ```
 * Refer to https://github.com/toeverything/AFFiNE/blob/b59b010decb9c5decd9e3090f1a417696ce86f54/libs/components/editor-blocks/src/utils/indent.ts#L23-L122
 */
export function handleOutdent(
  page: Page,
  model: ExtendedModel,
  offset = 0,
  capture = true
) {
  const parent = page.getParent(model);
  if (!parent || matchFlavours(parent, ['affine:note'])) {
    // Topmost, do nothing
    return;
  }

  const grandParent = page.getParent(parent);
  if (!grandParent) return;
  // TODO: need better solution
  if (capture) {
    page.captureSync();
  }

  // 1. save child blocks of the parent block
  const previousSiblings = page.getPreviousSiblings(model);
  const nextSiblings = page.getNextSiblings(model);

  // 2. remove all child blocks after the target block from the parent block
  page.updateBlock(parent, {
    children: previousSiblings,
  });

  // 3. insert target block to the grand block
  const index = grandParent.children.indexOf(parent);
  page.updateBlock(grandParent, {
    children: [
      ...grandParent.children.slice(0, index + 1),
      model,
      ...grandParent.children.slice(index + 1),
    ],
  });

  // 4. append child blocks after the target block to the target block
  page.updateBlock(model, {
    children: [...model.children, ...nextSiblings],
  });

  // 5. If the target block is a numbered list, update the prefix of next siblings
  const nextSibling = page.getNextSibling(model);
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

  // FIXME: wait a microtask is a workaround. Prevent query legacy DOM before the DOM is updated
  // Fix https://github.com/toeverything/blocksuite/pull/3770
  Promise.resolve().then(() =>
    asyncSetVRange(model, { index: offset, length: 0 })
  );
}

export function handleMultiBlockOutdent(page: Page, models: BaseBlockModel[]) {
  if (!models.length) return;

  // Find the first model that can be outdented
  let firstOutdentIndex = -1;
  let firstParent: BaseBlockModel | null;
  for (let i = 0; i < models.length; i++) {
    firstParent = page.getParent(models[i]);
    if (firstParent && !matchFlavours(firstParent, ['affine:note'])) {
      firstOutdentIndex = i;
      break;
    }
  }

  // Find all the models that can be outdented
  const outdentModels = models.slice(firstOutdentIndex);
  // Form bottom to top
  // Only outdent the models which parent is not in the outdentModels
  // When parent is in the outdentModels
  // It means that children will be outdented with their parent
  for (let i = outdentModels.length - 1; i >= 0; i--) {
    const model = outdentModels[i];
    const parent = page.getParent(model);
    assertExists(parent);
    if (!outdentModels.includes(parent)) {
      handleOutdent(page, model);
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
    handleOutdent(page, model, offset);
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
function handleCodeBlockForwardDelete(_page: Page, model: ExtendedModel) {
  if (!matchFlavours(model, ['affine:code'])) return false;
  return true;
}

function handleDatabaseBlockBackspace(page: Page, model: ExtendedModel) {
  if (!isInsideBlockByFlavour(page, model, 'affine:database')) return false;

  return true;
}

function handleDatabaseBlockForwardDelete(page: Page, model: ExtendedModel) {
  if (!isInsideBlockByFlavour(page, model, 'affine:database')) return false;

  return true;
}

// When deleting at line start of a list block,
// switch it to normal paragraph block.
function handleListBlockBackspace(page: Page, model: ExtendedModel) {
  if (!matchFlavours(model, ['affine:list'])) return false;

  const parent = page.getParent(model);
  if (!parent) return false;

  const index = parent.children.indexOf(model);
  const blockProps = {
    type: 'text' as const,
    text: model.text?.clone(),
    children: model.children,
  };
  page.captureSync();
  page.deleteBlock(model);
  const id = page.addBlock('affine:paragraph', blockProps, parent, index);
  asyncFocusRichText(page, id);
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
function handleListBlockForwardDelete(page: Page, model: ExtendedModel) {
  if (!matchFlavours(model, ['affine:list'])) return false;
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
      const nextBlock = getNextBlock(model);
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
  const vEditor = getVirgoByModel(previousSibling);
  vEditor?.setVRange({
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
  if (
    !matchFlavours(previousSibling, [
      'affine:image',
      'affine:divider',
      'affine:code',
      'affine:bookmark',
      'affine:attachment',
    ] as const)
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

function handleNoPreviousSibling(page: Page, model: ExtendedModel) {
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
  if (page.getNextSibling(model)) {
    page.deleteBlock(model);
  } else {
    text?.clear();
  }
  focusTitle(page, title.length - textLength);
  return true;
}

function handleParagraphDeleteActions(page: Page, model: ExtendedModel) {
  const parent = page.getParent(model);
  if (!parent) return false;
  const previousSibling = getPreviousBlock(model);
  if (!previousSibling) {
    return handleNoPreviousSibling(page, model);
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

function handleParagraphBlockBackspace(page: Page, model: ExtendedModel) {
  if (!matchFlavours(model, ['affine:paragraph'])) return false;

  // When deleting at line start of a paragraph block,
  // firstly switch it to normal text, then delete this empty block.
  if (model.type !== 'text') {
    // Try to switch to normal text
    page.captureSync();
    page.updateBlock(model, { type: 'text' });
    return true;
  }

  const isHandled = handleParagraphDeleteActions(page, model);
  if (isHandled) return true;

  // Before
  // - line1
  //   - | <- cursor here, press backspace
  //   - line3
  //
  // After
  // - line1
  // - | <- cursor here
  //   - line3
  handleOutdent(page, model);
  return true;
}

function handleParagraphBlockForwardDelete(page: Page, model: ExtendedModel) {
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
        const nextBlock = getNextBlock(model);
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
    const nextBlock = getNextBlock(model);
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
      if (
        !nextSibling ||
        !matchFlavours(nextSibling, [
          'affine:image',
          'affine:divider',
          'affine:code',
        ])
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

export function handleLineStartBackspace(page: Page, model: ExtendedModel) {
  if (
    handleListBlockBackspace(page, model) ||
    handleParagraphBlockBackspace(page, model)
  ) {
    handleDatabaseBlockBackspace(page, model);
    return;
  }

  handleUnknownBlockBackspace(model);
}

export function handleLineEndForwardDelete(page: Page, model: ExtendedModel) {
  if (
    handleCodeBlockForwardDelete(page, model) ||
    handleListBlockForwardDelete(page, model) ||
    handleParagraphBlockForwardDelete(page, model)
  ) {
    handleDatabaseBlockForwardDelete(page, model);
    return;
  }
  handleUnknownBlockForwardDelete(model);
}
