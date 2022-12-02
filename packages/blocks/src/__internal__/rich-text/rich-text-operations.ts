// operations used in rich-text level

import { Page, Text } from '@blocksuite/store';
import type Quill from 'quill';
import {
  ExtendedModel,
  assertExists,
  getRichTextByModel,
  getContainerByModel,
  getPreviousBlock,
  ALLOW_DEFAULT,
  caretRangeFromPoint,
  focusNextBlock,
  focusPreviousBlock,
  getNextBlock,
  Point,
  PREVENT_DEFAULT,
  asyncFocusRichText,
  convertToList,
  convertToParagraph,
  convertToDivider,
  getDefaultPageBlock,
  getBlockElementByModel,
  resetNativeSelection,
} from '../utils';

export function handleBlockEndEnter(page: Page, model: ExtendedModel) {
  const parent = page.getParent(model);
  const index = parent?.children.indexOf(model);
  if (parent && index !== undefined && index > -1) {
    // make adding text block by enter a standalone operation
    page.captureSync();

    let id = '';
    if (model.flavour === 'affine:list') {
      const blockProps = {
        flavour: model.flavour,
        type: model.type,
      };
      if (model.children.length === 0) {
        id = page.addBlock(blockProps, parent, index + 1);
      } else {
        id = page.addBlock(blockProps, model, 0);
      }
    } else {
      const blockProps = {
        flavour: model.flavour,
        type: 'text',
      };
      id = page.addBlock(blockProps, parent, index + 1);
    }
    id && asyncFocusRichText(page, id);
  }
}

export function handleSoftEnter(
  page: Page,
  model: ExtendedModel,
  index: number
) {
  page.captureSync();
  model.text?.insert('\n', index);
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
  if (model.flavour === 'affine:list' && model.children.length > 0) {
    newParent = model;
    newBlockIndex = 0;
  }
  const id = page.addBlock(
    { flavour: model.flavour, text: right, type: model.type },
    newParent,
    newBlockIndex
  );
  asyncFocusRichText(page, id);
}

export function handleIndent(page: Page, model: ExtendedModel, offset: number) {
  const previousSibling = page.getPreviousSibling(model);
  if (previousSibling) {
    page.captureSync();

    const blockProps = {
      flavour: model.flavour,
      type: model.type,
      text: model?.text?.clone(), // should clone before `deleteBlock`
      children: model.children,
    };
    page.deleteBlock(model);
    const id = page.addBlock(blockProps, previousSibling);
    // FIXME: after quill onload
    requestAnimationFrame(() => {
      const block = page.getBlockById(id);
      assertExists(block);
      const richText = getRichTextByModel(block);
      richText?.quill.setSelection(offset, 0);
    });
  }
}

export async function handleUnindent(
  page: Page,
  model: ExtendedModel,
  offset: number
) {
  const parent = page.getParent(model);
  if (!parent || parent?.flavour === 'affine:group') return;

  const grandParent = page.getParent(parent);
  if (!grandParent) return;

  const index = grandParent.children.indexOf(parent);
  const blockProps = {
    flavour: model.flavour,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
    type: model.type,
  };

  page.captureSync();
  page.deleteBlock(model);
  const id = page.addBlock(blockProps, grandParent, index + 1);

  // FIXME: after quill onload
  requestAnimationFrame(() => {
    const block = page.getBlockById(id);
    assertExists(block);

    const richText = getRichTextByModel(block);
    richText?.quill.setSelection(offset, 0);
  });
}

export function handleLineStartBackspace(page: Page, model: ExtendedModel) {
  // When deleting at line start of a paragraph block,
  // firstly switch it to normal text, then delete this empty block.
  if (model.flavour === 'affine:paragraph') {
    if (model.type !== 'text') {
      page.captureSync();
      page.updateBlock(model, { type: 'text' });
    } else {
      const parent = page.getParent(model);
      if (!parent || parent?.flavour === 'affine:group') {
        const container = getContainerByModel(model);
        const previousSibling = getPreviousBlock(container, model.id);
        if (previousSibling?.flavour === 'affine:divider') {
          const selectionManager = getDefaultPageBlock(model).selection;
          const dividerBlockElement = getBlockElementByModel(
            previousSibling
          ) as HTMLElement;
          const selectionRect = dividerBlockElement.getBoundingClientRect();
          selectionManager.selectBlockByRect(selectionRect, model);
          resetNativeSelection(null);
        }
        if (previousSibling && previousSibling.flavour === 'affine:paragraph') {
          page.captureSync();
          const preTextLength = previousSibling.text?.length || 0;
          previousSibling.text?.join(model.text as Text);
          page.deleteBlock(model);
          const richText = getRichTextByModel(previousSibling);
          richText?.quill?.setSelection(preTextLength, 0);
        }
      } else {
        const grandParent = page.getParent(parent);
        if (!grandParent) return;
        const index = grandParent.children.indexOf(parent);
        const blockProps = {
          flavour: model.flavour,
          text: model?.text?.clone(), // should clone before `deleteBlock`
          children: model.children,
          type: model.type,
        };

        page.captureSync();
        page.deleteBlock(model);
        page.addBlock(blockProps, grandParent, index + 1);
      }
    }
  }
  // When deleting at line start of a list block,
  // switch it to normal paragraph block.
  else if (model.flavour === 'affine:list') {
    const parent = page.getParent(model);
    if (!parent) return;

    const index = parent.children.indexOf(model);
    page.captureSync();

    const blockProps = {
      flavour: 'affine:paragraph',
      type: 'text',
      text: model?.text?.clone(),
      children: model.children,
    };
    page.deleteBlock(model);
    const id = page.addBlock(blockProps, parent, index);
    asyncFocusRichText(page, id);
  }
}

export function handleKeyUp(model: ExtendedModel, editableContainer: Element) {
  const selection = window.getSelection();
  const container = getContainerByModel(model);
  const preNodeModel = getPreviousBlock(container, model.id);
  if (selection) {
    const range = selection.getRangeAt(0);
    const { height, left, top } = range.getBoundingClientRect();
    // if cursor is on the first line and has no text, height is 0
    if (height === 0 && top === 0) {
      const rect = range.startContainer.parentElement?.getBoundingClientRect();
      if (preNodeModel?.flavour === 'affine:divider') {
        const selectionManager = getDefaultPageBlock(model).selection;
        const dividerBlockElement = getBlockElementByModel(
          preNodeModel
        ) as HTMLElement;
        const selectionRect = dividerBlockElement.getBoundingClientRect();
        selectionManager.selectBlockByRect(selectionRect, model);
        resetNativeSelection(null);
        return PREVENT_DEFAULT;
      }
      rect && focusPreviousBlock(model, new Point(rect.left, rect.top));
      return PREVENT_DEFAULT;
    }
    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, top - height / 2);
    if (
      (!newRange || !editableContainer.contains(newRange.startContainer)) &&
      !isAtLineEdge(range)
    ) {
      // FIXME: Then it will turn the input into the div
      if (preNodeModel?.flavour === 'affine:group') {
        (
          document.querySelector(
            '.affine-default-page-block-title'
          ) as HTMLInputElement
        ).focus();
      } else if (preNodeModel?.flavour === 'affine:divider') {
        const selectionManager = getDefaultPageBlock(model).selection;
        const dividerBlockElement = getBlockElementByModel(
          preNodeModel
        ) as HTMLElement;
        const selectionRect = dividerBlockElement.getBoundingClientRect();
        selectionManager.selectBlockByRect(selectionRect, model);
        resetNativeSelection(null);
        return PREVENT_DEFAULT;
      } else {
        focusPreviousBlock(model, new Point(left, top));
      }
      return PREVENT_DEFAULT;
    }
  }
  return ALLOW_DEFAULT;
}

// We should determine if the cursor is at the edge of the block, since a cursor at edge may have two cursor points
// but only one bounding rect.
// If a cursor is at the edge of a block, its previous cursor rect will not equal to the next one.
function isAtLineEdge(range: Range) {
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
    if (height === 0 && bottom === 0) {
      const rect = range.startContainer.parentElement?.getBoundingClientRect();
      const nextBlock = getNextBlock(model.id);
      if (!nextBlock) {
        return ALLOW_DEFAULT;
      }
      if (nextBlock.flavour === 'affine:divider') {
        const selectionManager = getDefaultPageBlock(model).selection;
        const dividerBlockElement = getBlockElementByModel(
          nextBlock
        ) as HTMLElement;
        const selectionRect = dividerBlockElement.getBoundingClientRect();
        selectionManager.selectBlockByRect(selectionRect, model);
        resetNativeSelection(null);
        return PREVENT_DEFAULT;
      }
      rect && focusNextBlock(model, new Point(rect.left, rect.top));
      return PREVENT_DEFAULT;
    }
    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, bottom + height / 2);
    if (!newRange || !textContainer.contains(newRange.startContainer)) {
      const nextBlock = getNextBlock(model.id);
      if (!nextBlock) {
        return ALLOW_DEFAULT;
      }
      if (nextBlock.flavour === 'affine:divider') {
        const selectionManager = getDefaultPageBlock(model).selection;
        const dividerBlockElement = getBlockElementByModel(
          nextBlock
        ) as HTMLElement;
        const selectionRect = dividerBlockElement.getBoundingClientRect();
        selectionManager.selectBlockByRect(selectionRect, model);
        resetNativeSelection(null);
        return PREVENT_DEFAULT;
      }
      focusNextBlock(model, new Point(left, bottom));
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
        focusNextBlock(
          model,
          new Point(textContainer.getBoundingClientRect().left || left, bottom)
        );
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
      isConverted = convertToDivider(page, model, 'normal', prefix);
      break;
    case '---':
      isConverted = convertToDivider(page, model, 'normal', prefix);
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
