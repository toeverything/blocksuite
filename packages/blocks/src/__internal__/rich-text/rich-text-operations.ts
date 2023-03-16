// operations used in rich-text level

import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';
import type { BlockModelProps } from '@blocksuite/global/types';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Text, Utils } from '@blocksuite/store';

import type { PageBlockModel } from '../../models.js';
import { checkFirstLine, checkLastLine } from '../utils/check-line.js';
import {
  asyncFocusRichText,
  asyncSetVRange,
} from '../utils/common-operations.js';
import {
  getModelByElement,
  getPreviousBlock,
  getVirgoByModel,
} from '../utils/query.js';
import {
  focusBlockByModel,
  focusTitle,
  getCurrentNativeRange,
} from '../utils/selection.js';
import { supportsChildren } from '../utils/std.js';
import type { ExtendedModel } from '../utils/types.js';

export function handleBlockEndEnter(page: Page, model: ExtendedModel) {
  const parent = page.getParent(model);
  const nextSibling = page.getNextSibling(model);
  if (!parent) {
    return;
  }
  if (Utils.doesInsideBlockByFlavour(page, model, 'affine:database')) {
    // todo: jump into next row
    return;
  }
  const index = parent.children.indexOf(model);
  if (index === -1) {
    return;
  }
  // make adding text block by enter a standalone operation
  page.captureSync();

  const getProps = ():
    | ['affine:list', Partial<BlockModelProps['affine:list']>]
    | ['affine:paragraph', Partial<BlockModelProps['affine:paragraph']>] => {
    const shouldInheritFlavour = matchFlavours(model, ['affine:list'] as const);
    if (shouldInheritFlavour) {
      return [model.flavour, { type: model.type }];
    }
    return ['affine:paragraph', { type: 'text' }];
  };
  const [flavour, blockProps] = getProps();

  const id = !model.children.length
    ? page.addBlockByFlavour(flavour, blockProps, parent, index + 1)
    : // If the block has children, insert a new block as the first child
      page.addBlockByFlavour(flavour, blockProps, model, 0);

  // 4. If the target block is a numbered list, update the prefix of next siblings
  if (
    matchFlavours(model, ['affine:list'] as const) &&
    model.type === 'numbered'
  ) {
    let next = nextSibling;
    while (
      next &&
      matchFlavours(next, ['affine:list'] as const) &&
      model.type === 'numbered'
    ) {
      page.updateBlock(next, {});
      next = page.getNextSibling(next);
    }
  }

  asyncFocusRichText(page, id);
}

export function handleSoftEnter(
  page: Page,
  model: ExtendedModel,
  index: number,
  length: number
) {
  if (!model.text) {
    console.error('Failed to handle soft enter! No text found!', model);
    return;
  }
  page.captureSync();
  model.text.replace(index, length, '\n');
}

export function handleBlockSplit(
  page: Page,
  model: ExtendedModel,
  splitIndex: number,
  splitLength: number
) {
  if (!(model.text instanceof Text)) return;

  const parent = page.getParent(model);
  if (!parent) return;

  page.captureSync();
  const right = model.text.split(splitIndex, splitLength);

  let newParent = parent;
  let newBlockIndex = newParent.children.indexOf(model) + 1;
  if (
    matchFlavours(model, ['affine:list'] as const) &&
    model.children.length > 0
  ) {
    newParent = model;
    newBlockIndex = 0;
  }
  const children = [...model.children];
  page.updateBlockById(model.id, { children: [] });
  const id = page.addBlockByFlavour(
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
  if (
    matchFlavours(model, ['affine:list'] as const) &&
    model.type === 'numbered'
  ) {
    let next = nextSibling;
    while (
      next &&
      matchFlavours(next, ['affine:list'] as const) &&
      model.type === 'numbered'
    ) {
      page.updateBlock(next, {});
      next = page.getNextSibling(next);
    }
  }

  assertExists(model);
  asyncSetVRange(model, { index: offset, length: 0 });
}

export function handleMultiBlockIndent(page: Page, models: BaseBlockModel[]) {
  if (!models.length) return;
  const previousSibling = page.getPreviousSibling(models[0]);
  const nextSibling = page.getNextSibling(models.at(-1) as BaseBlockModel);

  if (!previousSibling || !supportsChildren(previousSibling)) {
    // Bottom, can not indent, do nothing
    return;
  }
  if (
    !models.every((model, idx, array) => {
      const previousModel = array.at(idx - 1);
      if (!previousModel) {
        return false;
      }
      const p1 = page.getParent(model);
      const p2 = page.getParent(previousModel);
      return p1 && p2 && p1.id === p2.id;
    })
  ) {
    return;
  }
  page.captureSync();
  const parent = page.getParent(models[0]);
  assertExists(parent);
  models.forEach(model => {
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
    if (
      matchFlavours(model, ['affine:list'] as const) &&
      model.type === 'numbered'
    ) {
      let next = nextSibling;
      while (
        next &&
        matchFlavours(next, ['affine:list'] as const) &&
        model.type === 'numbered'
      ) {
        page.updateBlock(next, {});
        next = page.getNextSibling(next);
      }
    }

    assertExists(model);
    asyncSetVRange(model, { index: 0, length: 0 });
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
export function handleUnindent(
  page: Page,
  model: ExtendedModel,
  offset = 0,
  capture = true
) {
  const parent = page.getParent(model);
  if (!parent || matchFlavours(parent, ['affine:frame'] as const)) {
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

  // 3. append child blocks after the target block to the target block
  page.updateBlock(model, {
    children: [...model.children, ...nextSiblings],
  });

  // 4. insert target block to the grand block
  const index = grandParent.children.indexOf(parent);
  page.updateBlock(grandParent, {
    children: [
      ...grandParent.children.slice(0, index + 1),
      model,
      ...grandParent.children.slice(index + 1),
    ],
  });

  // 5. If the target block is a numbered list, update the prefix of next siblings
  const nextSibling = page.getNextSibling(model);
  if (
    matchFlavours(model, ['affine:list'] as const) &&
    model.type === 'numbered'
  ) {
    let next = nextSibling;
    while (
      next &&
      matchFlavours(next, ['affine:list'] as const) &&
      model.type === 'numbered'
    ) {
      page.updateBlock(next, {});
      next = page.getNextSibling(next);
    }
  }

  assertExists(model);
  asyncSetVRange(model, { index: offset, length: 0 });
}

export function handleLineStartBackspace(page: Page, model: ExtendedModel) {
  // When deleting at line start of a code block,
  // select the code block itself
  if (matchFlavours(model, ['affine:code'] as const)) {
    focusBlockByModel(model);
    return;
  }
  if (Utils.doesInsideBlockByFlavour(page, model, 'affine:database')) {
    // Forbid user to delete a block inside database block
    return;
  }

  // When deleting at line start of a list block,
  // switch it to normal paragraph block.
  if (matchFlavours(model, ['affine:list'] as const)) {
    const parent = page.getParent(model);
    if (!parent) return;

    const index = parent.children.indexOf(model);
    const blockProps = {
      type: 'text' as const,
      text: model.text?.clone(),
      children: model.children,
    };
    page.captureSync();
    page.deleteBlock(model);
    const id = page.addBlockByFlavour(
      'affine:paragraph',
      blockProps,
      parent,
      index
    );
    asyncFocusRichText(page, id);
    return;
  }

  // When deleting at line start of a paragraph block,
  // firstly switch it to normal text, then delete this empty block.
  if (matchFlavours(model, ['affine:paragraph'] as const)) {
    if (model.type !== 'text') {
      // Try to switch to normal text
      page.captureSync();
      page.updateBlock(model, { type: 'text' });
      return;
    }

    const parent = page.getParent(model);
    if (!parent || matchFlavours(parent, ['affine:frame'] as const)) {
      const previousSibling = getPreviousBlock(model);
      const previousSiblingParent = previousSibling
        ? page.getParent(previousSibling)
        : null;
      if (
        previousSiblingParent &&
        matchFlavours(previousSiblingParent, ['affine:database'] as const)
      ) {
        focusBlockByModel(previousSiblingParent, 'end');
        // We can not delete block if the block has content
        if (!model.text?.length) {
          page.captureSync();
          page.deleteBlock(model);
        }
      } else if (
        previousSibling &&
        matchFlavours(previousSibling, [
          'affine:paragraph',
          'affine:list',
        ] as const)
      ) {
        page.captureSync();
        const preTextLength = previousSibling.text?.length || 0;
        model.text?.length && previousSibling.text?.join(model.text as Text);
        page.deleteBlock(model, {
          bringChildrenTo: previousSibling,
        });
        const vEditor = getVirgoByModel(previousSibling);
        vEditor?.setVRange({
          index: preTextLength,
          length: 0,
        });
      } else if (
        previousSibling &&
        matchFlavours(previousSibling, [
          'affine:embed',
          'affine:divider',
          'affine:code',
        ] as const)
      ) {
        focusBlockByModel(previousSibling);
        // We can not delete block if the block has content
        if (!model.text?.length) {
          page.captureSync();
          page.deleteBlock(model);
        }
      } else {
        // No previous sibling, it's the first block
        // Try to merge with the title

        const text = model.text;
        const titleElement = document.querySelector(
          '.affine-default-page-block-title'
        ) as HTMLTextAreaElement;
        const pageModel = getModelByElement(titleElement) as PageBlockModel;
        const title = pageModel.title;

        page.captureSync();
        let textLength = 0;
        if (text) {
          textLength = text.length;
          title.join(text);
        }
        page.deleteBlock(model);
        focusTitle(title.length - textLength);
      }
    }

    // Before
    // - line1
    //   - | <- cursor here, press backspace
    //   - line3
    //
    // After
    // - line1
    // - | <- cursor here
    //   - line3
    handleUnindent(page, model);
    return;
  }

  throw new Error(
    'Failed to handle backspace! Unknown block flavours! flavour:' +
      model.flavour
  );
}

export function handleKeyUp(event: KeyboardEvent, editableContainer: Element) {
  const range = getCurrentNativeRange();
  if (!range.collapsed) {
    // If the range is not collapsed,
    // we assume that the caret is at the start of the range.
    range.collapse(true);
  }
  const isFirstLine = checkFirstLine(range, editableContainer);
  if (isFirstLine) {
    // If the caret is at the first line of the block,
    // default behavior will move the caret to the start of the line,
    // which is not expected. so we need to prevent default behavior.
    return PREVENT_DEFAULT;
  }
  // Avoid triggering hotkey bindings
  event.stopPropagation();
  return ALLOW_DEFAULT;
}

export function handleKeyDown(
  event: KeyboardEvent,
  editableContainer: HTMLElement
) {
  const range = getCurrentNativeRange();
  if (!range.collapsed) {
    // If the range is not collapsed,
    // we assume that the caret is at the end of the range.
    range.collapse();
  }
  const isLastLine = checkLastLine(range, editableContainer);
  if (isLastLine) {
    // If the caret is at the last line of the block,
    // default behavior will move the caret to the end of the line,
    // which is not expected. so we need to prevent default behavior.
    return PREVENT_DEFAULT;
  }
  // Avoid triggering hotkey bindings
  event.stopPropagation();
  return ALLOW_DEFAULT;
}
