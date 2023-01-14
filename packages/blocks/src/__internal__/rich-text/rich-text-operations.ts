// operations used in rich-text level

import { Page, Text } from '@blocksuite/store';
import type { Quill } from 'quill';
import {
  ExtendedModel,
  getRichTextByModel,
  getContainerByModel,
  getPreviousBlock,
  ALLOW_DEFAULT,
  caretRangeFromPoint,
  getNextBlock,
  PREVENT_DEFAULT,
  asyncFocusRichText,
  convertToList,
  convertToParagraph,
  convertToDivider,
  focusPreviousBlock,
  focusBlockByModel,
  supportsChildren,
  getModelByElement,
} from '../utils/index.js';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';

export function handleBlockEndEnter(page: Page, model: ExtendedModel) {
  const parent = page.getParent(model);
  if (!parent) {
    return;
  }
  const index = parent.children.indexOf(model);
  if (index === -1) {
    return;
  }
  // make adding text block by enter a standalone operation
  page.captureSync();

  const shouldInheritFlavour = matchFlavours(model, ['affine:list']);
  const blockProps = shouldInheritFlavour
    ? {
        flavour: model.flavour,
        type: model.type,
      }
    : {
        flavour: 'affine:paragraph' as const,
        type: 'text',
      };

  const id = !model.children.length
    ? page.addBlockByFlavour(blockProps.flavour, blockProps, parent, index + 1)
    : // If the block has children, insert a new block as the first child
      page.addBlockByFlavour(blockProps.flavour, blockProps, model, 0);

  asyncFocusRichText(page, id);
}

export function handleSoftEnter(
  page: Page,
  model: ExtendedModel,
  index: number
) {
  page.captureSync();
  const shouldFormatCode = matchFlavours(model, ['affine:code']);
  model.text?.insert(
    '\n',
    index,
    shouldFormatCode ? { 'code-block': true } : {}
  );
}

export function handleBlockSplit(
  page: Page,
  model: ExtendedModel,
  splitIndex: number
) {
  if (!(model.text instanceof Text)) return;

  const parent = page.getParent(model);
  if (!parent) return;

  const [left, right] = model.text.split(splitIndex);
  page.captureSync();
  page.markTextSplit(model.text, left, right);
  page.updateBlock(model, { text: left });

  let newParent = parent;
  let newBlockIndex = newParent.children.indexOf(model) + 1;
  if (matchFlavours(model, ['affine:list']) && model.children.length > 0) {
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
  asyncFocusRichText(page, id);
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

  // FIXME: after quill onload
  requestAnimationFrame(() => {
    assertExists(model);
    const richText = getRichTextByModel(model);
    richText?.quill.setSelection(offset, 0);
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
export function handleUnindent(page: Page, model: ExtendedModel, offset = 0) {
  const parent = page.getParent(model);
  if (!parent || matchFlavours(parent, ['affine:frame'])) {
    // Topmost, do nothing
    return;
  }

  const grandParent = page.getParent(parent);
  if (!grandParent) return;
  page.captureSync();

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

  // FIXME: after quill onload
  requestAnimationFrame(() => {
    assertExists(model);
    const richText = getRichTextByModel(model);
    richText?.quill.setSelection(offset, 0);
  });
}

export function handleLineStartBackspace(page: Page, model: ExtendedModel) {
  // When deleting at line start of a code block,
  // select the code block itself
  if (matchFlavours(model, ['affine:code'])) {
    focusBlockByModel(model);
    return;
  }

  // When deleting at line start of a list block,
  // switch it to normal paragraph block.
  if (matchFlavours(model, ['affine:list'])) {
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
  if (matchFlavours(model, ['affine:paragraph'])) {
    if (model.type !== 'text') {
      // Try to switch to normal text
      page.captureSync();
      page.updateBlock(model, { type: 'text' });
      return;
    }

    const parent = page.getParent(model);
    if (!parent || matchFlavours(parent, ['affine:frame'])) {
      const container = getContainerByModel(model);
      const previousSibling = getPreviousBlock(container, model.id);
      if (
        previousSibling &&
        matchFlavours(previousSibling, ['affine:paragraph', 'affine:list'])
      ) {
        page.captureSync();
        const preTextLength = previousSibling.text?.length || 0;
        model.text?.length && previousSibling.text?.join(model.text as Text);
        page.deleteBlock(model, {
          bringChildrenTo: previousSibling,
        });
        const richText = getRichTextByModel(previousSibling);
        richText?.quill?.setSelection(preTextLength, 0);
      } else if (
        previousSibling &&
        matchFlavours(previousSibling, [
          'affine:embed',
          'affine:divider',
          'affine:code',
        ])
      ) {
        window.requestAnimationFrame(() => {
          focusPreviousBlock(model, 'start');
          // We can not delete block if the block has content
          if (!model.text?.length) {
            page.captureSync();
            page.deleteBlock(model);
          }
        });
      } else if (
        previousSibling &&
        matchFlavours(previousSibling, ['affine:database'])
      ) {
        if (previousSibling.children.length === 0) {
          // delete by two backspace
          page.captureSync();
          page.deleteBlock(previousSibling);
        } else {
          page.captureSync();
          page.deleteBlock(model, {
            bringChildrenTo: previousSibling,
          });
        }
      } else {
        const richText = getRichTextByModel(model);
        if (richText) {
          const text = richText.quill.getText().trimEnd();
          const titleElement = document.querySelector(
            '.affine-default-page-block-title'
          ) as HTMLTextAreaElement;
          const oldTitle = titleElement.value;
          const title = oldTitle + text;
          page.captureSync();
          page.deleteBlock(model);
          // model.text?.delete(0, model.text.length);
          const titleModel = getModelByElement(titleElement);
          page.updateBlock(titleModel, { title });
          const oldTitleTextLength = oldTitle.length;
          titleElement.setSelectionRange(
            oldTitleTextLength,
            oldTitleTextLength
          );
          titleElement.focus();
        }
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

export function handleKeyUp(model: ExtendedModel, editableContainer: Element) {
  const selection = window.getSelection();
  const container = getContainerByModel(model);
  const preNodeModel = getPreviousBlock(container, model.id);
  if (selection) {
    const range = selection.getRangeAt(0);
    const { height, left, top } = range.getBoundingClientRect();

    const newRange = caretRangeFromPoint(left, top - height / 2);
    if (
      (!newRange || !editableContainer.contains(newRange.startContainer)) &&
      !isAtLineEdge(range)
    ) {
      if (
        preNodeModel &&
        matchFlavours(model, ['affine:embed', 'affine:divider'])
      ) {
        return ALLOW_DEFAULT;
      }
      return PREVENT_DEFAULT;
    }
  }
  return ALLOW_DEFAULT;
}

// We should determine if the cursor is at the edge of the block, since a cursor at edge may have two cursor points
// but only one bounding rect.
// If a cursor is at the edge of a block, its previous cursor rect will not equal to the next one.
export function isAtLineEdge(range: Range) {
  if (
    range.startOffset > 0 &&
    Number(range.startContainer.textContent?.length) - range.startOffset > 0
  ) {
    const prevRange = range.cloneRange();
    prevRange.setStart(range.startContainer, range.startOffset - 1);
    prevRange.setEnd(range.startContainer, range.startOffset - 1);
    const nextRange = range.cloneRange();
    nextRange.setStart(range.endContainer, range.endOffset + 1);
    nextRange.setEnd(range.endContainer, range.endOffset + 1);
    return (
      prevRange.getBoundingClientRect().top !==
      nextRange.getBoundingClientRect().top
    );
  }
  return false;
}

export function handleKeyDown(
  model: ExtendedModel,
  textContainer: HTMLElement
) {
  const selection = window.getSelection();
  if (selection) {
    const range = selection.getRangeAt(0);
    const { bottom, left, height } = range.getBoundingClientRect();
    // if cursor is on the last line and has no text, height is 0

    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, bottom + height / 2);
    if (!newRange || !textContainer.contains(newRange.startContainer)) {
      const nextBlock = getNextBlock(model.id);
      if (!nextBlock) {
        return ALLOW_DEFAULT;
      }
      if (matchFlavours(nextBlock, ['affine:divider'])) {
        return PREVENT_DEFAULT;
      }
      return PREVENT_DEFAULT;
    }
    // if cursor is at the edge of a block, it may out of the textContainer after keydown
    if (isAtLineEdge(range)) {
      const {
        height,
        left,
        bottom: nextBottom,
      } = newRange.getBoundingClientRect();
      const nextRange = caretRangeFromPoint(left, nextBottom + height / 2);
      if (!nextRange || !textContainer.contains(nextRange.startContainer)) {
        return PREVENT_DEFAULT;
      }
    }
  }
  return ALLOW_DEFAULT;
}

export function tryMatchSpaceHotkey(
  page: Page,
  model: ExtendedModel,
  quill: Quill,
  prefix: string,
  range: { index: number; length: number }
) {
  const [, offset] = quill.getLine(range.index);
  if (offset > prefix.length) {
    return ALLOW_DEFAULT;
  }
  if (matchFlavours(model, ['affine:code'])) {
    return ALLOW_DEFAULT;
  }
  let isConverted = false;
  switch (prefix.trim()) {
    case '[]':
    case '[ ]':
      isConverted = convertToList(page, model, 'todo', prefix, {
        checked: false,
      });
      break;
    case '[x]':
      isConverted = convertToList(page, model, 'todo', prefix, {
        checked: true,
      });
      break;
    case '-':
    case '*':
      isConverted = convertToList(page, model, 'bulleted', prefix);
      break;
    case '***':
      isConverted = convertToDivider(page, model, prefix);
      break;
    case '---':
      isConverted = convertToDivider(page, model, prefix);
      break;
    case '#':
      isConverted = convertToParagraph(page, model, 'h1', prefix);
      break;
    case '##':
      isConverted = convertToParagraph(page, model, 'h2', prefix);
      break;
    case '###':
      isConverted = convertToParagraph(page, model, 'h3', prefix);
      break;
    case '####':
      isConverted = convertToParagraph(page, model, 'h4', prefix);
      break;
    case '#####':
      isConverted = convertToParagraph(page, model, 'h5', prefix);
      break;
    case '######':
      isConverted = convertToParagraph(page, model, 'h6', prefix);
      break;
    case '>':
      isConverted = convertToParagraph(page, model, 'quote', prefix);
      break;
    default:
      isConverted = convertToList(page, model, 'numbered', prefix);
  }

  return isConverted ? PREVENT_DEFAULT : ALLOW_DEFAULT;
}
