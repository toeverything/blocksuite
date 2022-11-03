// operations used in rich-text level

import { Space, Text } from '@blocksuite/store';
import Quill from 'quill';
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
} from '../utils';

export function handleBlockEndEnter(space: Space, model: ExtendedModel) {
  const parent = space.getParent(model);
  const index = parent?.children.indexOf(model);
  if (parent && index !== undefined && index > -1) {
    // make adding text block by enter a standalone operation
    space.captureSync();

    let id = '';
    if (model.flavour === 'affine:list') {
      const blockProps = {
        flavour: model.flavour,
        type: model.type,
      };
      if (model.children.length === 0) {
        id = space.addBlock(blockProps, parent, index + 1);
      } else {
        id = space.addBlock(blockProps, model, 0);
      }
    } else {
      const blockProps = {
        flavour: model.flavour,
        type: 'text',
      };
      id = space.addBlock(blockProps, parent, index + 1);
    }
    id && asyncFocusRichText(space, id);
  }
}

export function handleSoftEnter(
  space: Space,
  model: ExtendedModel,
  index: number
) {
  space.captureSync();
  model.text?.insert('\n', index);
}

export function handleBlockSplit(
  space: Space,
  model: ExtendedModel,
  splitIndex: number
) {
  if (!(model.text instanceof Text)) return;

  const parent = space.getParent(model);
  if (!parent) return;

  const [left, right] = model.text.split(splitIndex);
  space.captureSync();
  space.markTextSplit(model.text, left, right);
  space.updateBlock(model, { text: left });

  let newParent = parent;
  let newBlockIndex = newParent.children.indexOf(model) + 1;
  if (model.flavour === 'affine:list' && model.children.length > 0) {
    newParent = model;
    newBlockIndex = 0;
  }
  const id = space.addBlock(
    { flavour: model.flavour, text: right, type: model.type },
    newParent,
    newBlockIndex
  );
  asyncFocusRichText(space, id);
}

export function handleIndent(
  space: Space,
  model: ExtendedModel,
  offset: number
) {
  const previousSibling = space.getPreviousSibling(model);
  if (previousSibling) {
    space.captureSync();

    const blockProps = {
      flavour: model.flavour,
      type: model.type,
      text: model?.text?.clone(), // should clone before `deleteBlock`
      children: model.children,
    };
    space.deleteBlock(model);
    const id = space.addBlock(blockProps, previousSibling);
    // FIXME: after quill onload
    requestAnimationFrame(() => {
      const block = space.getBlockById(id);
      assertExists(block);
      const richText = getRichTextByModel(block);
      richText?.quill.setSelection(offset, 0);
    });
  }
}

export async function handleUnindent(
  space: Space,
  model: ExtendedModel,
  offset: number
) {
  const parent = space.getParent(model);
  if (!parent || parent?.flavour === 'affine:group') return;

  const grandParent = space.getParent(parent);
  if (!grandParent) return;

  const index = grandParent.children.indexOf(parent);
  const blockProps = {
    flavour: model.flavour,
    text: model?.text?.clone(), // should clone before `deleteBlock`
    children: model.children,
    type: model.type,
  };

  space.captureSync();
  space.deleteBlock(model);
  const id = space.addBlock(blockProps, grandParent, index + 1);

  // FIXME: after quill onload
  requestAnimationFrame(() => {
    const block = space.getBlockById(id);
    assertExists(block);

    const richText = getRichTextByModel(block);
    richText?.quill.setSelection(offset, 0);
  });
}

export function handleLineStartBackspace(space: Space, model: ExtendedModel) {
  // When deleting at line start of a paragraph block,
  // firstly switch it to normal text, then delete this empty block.
  if (model.flavour === 'affine:paragraph') {
    if (model.type !== 'text') {
      space.captureSync();
      space.updateBlock(model, { type: 'text' });
    } else {
      const parent = space.getParent(model);
      if (!parent || parent?.flavour === 'affine:group') {
        const container = getContainerByModel(model);
        const previousSibling = getPreviousBlock(container, model.id);
        if (previousSibling) {
          space.captureSync();
          previousSibling.text?.join(model.text as Text);
          space.deleteBlock(model);
          asyncFocusRichText(space, previousSibling.id);
        }
      } else {
        const grandParent = space.getParent(parent);
        if (!grandParent) return;
        const index = grandParent.children.indexOf(parent);
        const blockProps = {
          flavour: model.flavour,
          text: model?.text?.clone(), // should clone before `deleteBlock`
          children: model.children,
          type: model.type,
        };

        space.captureSync();
        space.deleteBlock(model);
        space.addBlock(blockProps, grandParent, index + 1);
      }
    }
  }
  // When deleting at line start of a list block,
  // switch it to normal paragraph block.
  else if (model.flavour === 'affine:list') {
    const parent = space.getParent(model);
    if (!parent) return;

    const index = parent.children.indexOf(model);
    space.captureSync();

    const blockProps = {
      flavour: 'affine:paragraph',
      type: 'text',
      text: model?.text?.clone(),
      children: model.children,
    };
    space.deleteBlock(model);
    const id = space.addBlock(blockProps, parent, index);
    asyncFocusRichText(space, id);
  }
}

export function handleKeyUp(model: ExtendedModel, editableContainer: Element) {
  const selection = window.getSelection();
  if (selection) {
    const range = selection.getRangeAt(0);
    const { height, left, top } = range.getBoundingClientRect();
    // if cursor is on the first line and has no text, height is 0
    if (height === 0 && top === 0) {
      const rect = range.startContainer.parentElement?.getBoundingClientRect();
      rect && focusPreviousBlock(model, new Point(rect.left, rect.top));
      return PREVENT_DEFAULT;
    }
    // TODO resolve compatible problem
    const newRange = caretRangeFromPoint(left, top - height / 2);
    if (
      (!newRange || !editableContainer.contains(newRange.startContainer)) &&
      !isAtLineEdge(range)
    ) {
      const container = getContainerByModel(model);
      const preNodeModel = getPreviousBlock(container, model.id);
      // FIXME: Then it will turn the input into the div
      if (preNodeModel?.flavour === 'affine:group') {
        (
          document.querySelector(
            '.affine-default-page-block-title'
          ) as HTMLInputElement
        ).focus();
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
  space: Space,
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
      isConverted = convertToList(space, model, 'todo', prefix, {
        checked: false,
      });
      break;
    case '[x]':
      isConverted = convertToList(space, model, 'todo', prefix, {
        checked: true,
      });
      break;
    case '-':
    case '*':
      isConverted = convertToList(space, model, 'bulleted', prefix);
      break;
    case '#':
      isConverted = convertToParagraph(space, model, 'h1', prefix);
      break;
    case '##':
      isConverted = convertToParagraph(space, model, 'h2', prefix);
      break;
    case '###':
      isConverted = convertToParagraph(space, model, 'h3', prefix);
      break;
    case '####':
      isConverted = convertToParagraph(space, model, 'h4', prefix);
      break;
    case '#####':
      isConverted = convertToParagraph(space, model, 'h5', prefix);
      break;
    case '######':
      isConverted = convertToParagraph(space, model, 'h6', prefix);
      break;
    case '>':
      isConverted = convertToParagraph(space, model, 'quote', prefix);
      break;
    default:
      isConverted = convertToList(space, model, 'numbered', prefix);
  }

  return isConverted ? PREVENT_DEFAULT : ALLOW_DEFAULT;
}
